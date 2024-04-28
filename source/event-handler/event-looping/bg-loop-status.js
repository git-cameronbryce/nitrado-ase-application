const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const rateLimit = require('axios-rate-limit');
const { db } = require('../../script');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };
const api = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 250 });

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      const maintenance = async (nitrado, service_id, status) => {
        const channel = await client.channels.fetch(status.channel);

        const url = `https://api.nitrado.net/services/${service_id}/gameservers/restart`;
        const response = await api.post(url, { message: `Obelisk Auto Restart: ${status}` }, { headers: { 'Authorization': nitrado.token } });
        if (response.status === 200) {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: `Tip: Contact support if there are issues.` })
            .setDescription(`**Automatic Server Maintenance**\nOffline server, brought back online.\nServer Identifiaction #: \`${service_id}\`\n<t:${Math.floor(Date.now() / 1000)}:f>`)

          await channel.send({ embeds: [embed] })
        };
      };

      const parse = async (nitrado, status, services) => {
        const tasks = await services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await api.get(url, { headers: { 'Authorization': nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game] && response.data.data.gameserver.status === 'stopped') {
            await maintenance(nitrado, service.id, status)
          }
        });
      }

      const gameserver = async (nitrado, status, services) => {
        try {
          const channel = await client.channels.fetch(status.channel);
          const message = await channel.messages.fetch(status.message);

          let current = 0, total = 0;
          const actions = await Promise.all(
            services.map(async (service) => {
              if (platforms[service.details.folder_short]) {
                const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
                const response = await api.get(url, { headers: { 'Authorization': nitrado.token } });
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
              case 'restarting':
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

          const monitoring = status.asm ? '**Auto Server Maintenance**\nThis feature is activated, and offline services will be automatically restored and returned online.' : '**Auto Server Maintenance**\nThis feature is not active, offline services will not automatically be restored and returned online.';

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`${output}**Cluster Player Count**\n \`🌐\` \`(${current}/${total})\`\n\n<t:${Math.floor(Date.now() / 1000)}:R>\n${monitoring}\n\n**[Partnership & Information](https://nitra.do/obeliskdevelopment)**\nConsider using our partnership link to purchase your gameservers, it will help fund development.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.\nLimited 0 - 15 gameservers listed.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png');

          await message.edit({ embeds: [embed], components: [button] });

          if (status.asm) { await parse(nitrado, status, services) }

        } catch (error) { null };
      };

      const service = async (nitrado, status) => {
        const url = 'https://api.nitrado.net/services';
        const response = await api.get(url, { headers: { 'Authorization': nitrado.token } })
        const services = response.data.data.services;
        if (response.status === 200) { gameserver(nitrado, status, services) };
      };

      const token = async ({ nitrado, status }) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await api.get(url, { headers: { 'Authorization': nitrado.token } })
          if (response.status === 200) { service(nitrado, status) };
        } catch (error) { null };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 150000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};