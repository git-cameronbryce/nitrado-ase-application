const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      let output = '';
      let current = 0, total = 0;
      const parse = async (database, suspend_date, service_id, { status, query }) => {
        try {
          const channel = await client.channels.fetch(database.channel);
          const message = await channel.messages.fetch(database.message);
          const time = new Date(suspend_date).getTime() / 1000;

          switch (status) {
            case 'started':
              output += `\`🟢\` \`Service Online\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
              break;
            case 'restarted':
              output += `\`🟠\` \`Service Restarting\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
              break;
            case 'updating':
              output += `\`🟠\` \`Service Updating\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
              break;
            case 'stopping':
              output += `\`🔴\` \`Service Stopping\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
              break;
            case 'stopped':
              output += `\`🔴\` \`Service Stopped\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
              break;

            default:
              break;
          };

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

          const monitoring = database.asm ? '**Auto Server Maintenance**\nThis feature is activated, and offline services will be automatically restored and returned online.' : '**Auto Server Maintenance**\nThis feature is not active, offline services will not automatically be restored and returned online.';

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`${output}**Cluster Player Count**\n \`🌐\` \`(${current}/${total})\`\n\n<t:${Math.floor(Date.now() / 1000)}:R>\n${monitoring}\n\n**[Partnership & Information](https://nitra.do/obeliskdevelopment)**\nConsider using our partnership link to purchase your gameservers, it will help fund development.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.\nLimited 0 - 15 gameservers listed.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png');

          await message.edit({ embeds: [embed], components: [button] });

        } catch (error) {
          console.log(error)
          if (error.code === 50001) console.log('Missing access'), null;
        };
      };

      const maintenance = async (database, nitrado, service_id, { status }) => {
        const channel = await client.channels.fetch(database.channel);

        const url = `https://api.nitrado.net/services/${service_id}/gameservers/restart`;
        const response = await axios.post(url, { message: `Obelisk Auto Restart: ${status}` }, { headers: { 'Authorization': nitrado.token } });
        if (response.status === 200) {
          console.log('A:S:M Restarting')
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: `Tip: Contact support if there are issues.` })
            .setDescription(`**Automatic Server Maintenance**\nOffline server, brought back online.\nServer Identifiaction #: \`${service_id}\`\n<t:${Math.floor(Date.now() / 1000)}:f>`)

          await channel.send({ embeds: [embed] })
        }
      };

      const gameserver = async (document, nitrado, status, services) => {
        const statusTasks = await services.slice(0, 15).map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game]) {
            await parse(status, service.suspend_date, service.id, response.data.data.gameserver);
          };
        });

        const maintenanceTasks = await services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game] && status.asm && response.data.data.gameserver.status === 'stopped') {
            await maintenance(status, nitrado, service.id, response.data.data.gameserver);
          };
        });

        await Promise.all([...statusTasks, ...maintenanceTasks])
          .then(async () => {
            console.log(`Finished Status: ${document}`)
          })
      };

      const service = async (document, nitrado, status) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        const services = response.data.data.services;
        response.status === 200 ? gameserver(document, nitrado, status, services) : invalidService()
      };

      const token = async (document, { nitrado, status }) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? service(document, nitrado, status) : console.log('Invalid token');
        } catch (error) { null };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.id, doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 120000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};