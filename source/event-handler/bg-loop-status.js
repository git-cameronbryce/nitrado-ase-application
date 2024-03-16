const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      const gameserver = async (nitrado, status, services) => {
        try {
          const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };
          const channel = await client.channels.fetch(status.channel);
          const message = await channel.messages.fetch(status.message);

          let current = 0, total = 0;
          const actions = await Promise.all(
            services.map(async (service) => {
              if (platforms[service.details.folder_short]) {
                const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
                const response = await axios.get(url, { headers: { Authorization: nitrado.token } });
                const { status, query } = response.data.data.gameserver;
                const { suspend_date } = service;

                if (status === 'started') { current += query.player_current ? query.player_current : 0, total += query.player_max ? query.player_max : 0 };
                return { status, query, service, suspend_date };
              }
            })
          );

          const sortedActions = actions
            .sort((a, b) => {
              const playerCurrentA = a.query?.player_current || 0;
              const playerCurrentB = b.query?.player_current || 0;
              return playerCurrentB - playerCurrentA;
            })
            .filter(action => action);

          let output = '';
          sortedActions.slice(0, 15).forEach((action) => {
            const { status, query, service, suspend_date } = action;
            const time = new Date(suspend_date).getTime() / 1000;

            switch (status) {
              case 'started':
                output += `\`🟢\` \`Service Online\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'restarted':
                output += `\`🟠\` \`Service Restarting\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'updating':
                output += `\`🟠\` \`Service Updating\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'stopping':
                output += `\`🔴\` \`Service Stopping\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'stopped':
                output += `\`🔴\` \`Service Stopped\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;

              default:
                break;
            }
          });

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Cluster Command')
                .setCustomId('cluster-command')
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),

              new ButtonBuilder()
                .setLabel('Auto Maintanance')
                .setCustomId('auto-maintanance')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`${output}**Cluster Player Count**\n \`🌐\` \`(${current}/${total})\`\n\n<t:${Math.floor(Date.now() / 1000)}:R>\n**[Partnership & Information](https://nitra.do/obeliskdevelopment)**\nConsider using our partnership link to purchase your gameservers, it will help fund development.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.\nLimited 0 - 15 gameservers listed.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png');

          await message.edit({ embeds: [embed], components: [button] });

        } catch (error) {
          if (error.code === 50001) console.log('Missing access'), null;
        };
      };

      const service = async (nitrado, status) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        const services = response.data.data.services;
        response.status === 200 ? gameserver(nitrado, status, services) : invalidService()
      };

      const token = async ({ nitrado, status }) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? service(nitrado, status) : console.log('Invalid token');
        } catch (error) { null };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 120000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};