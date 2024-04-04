const { Events, Embed, EmbedBuilder } = require('discord.js');
const { db } = require('../../script');
const axios = require('axios');

const data = new Set();
process.on('unhandledRejection', (error) => console.error('error'));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {
      const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

      const gameserver = async (reference, services) => {
        if (!reference.online) { return };

        const extraction = async (service, players) => {
          let output = '';
          players.forEach(player => player.online === true ? output += `\`🟢\` \`Player Online\`\n\`🔗\` ${player.id}\n\`🔗\` ${player.name}\n\n` : null);

          Object.entries(reference.online).forEach(async entry => {
            if (parseInt(entry[0]) === service.id) {
              try {
                const channel = await client.channels.fetch(entry[1].thread);
                const message = await channel.messages.fetch(entry[1].message);

                const embed = new EmbedBuilder()
                  .setColor('#2ecc71')
                  .setFooter({ text: `Tip: Contact support if there are issues.` })
                  .setDescription(`${output.length > 1 ? `${output}Obelisk is watching for gameservers.\nScanned \`1\` of \`1\` updates.\n<t:${Math.floor(Date.now() / 1000)}:R>` : `**Additional Information**\nCurrently, there are zero players online.\n\nObelisk is monitoring for updates.\nScanned \`1\` of \`1\` gameservers.\n<t:${Math.floor(Date.now() / 1000)}:R>`}`);

                await message.edit({ embeds: [embed] });
              } catch (error) {
                if (error.code === 10003) { console.log('Missing Access') };
              };
            };
          });


        };

        const path = async (reference, service) => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers/games/players`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await extraction(service, response.data.data.players) }
        };

        const tasks = await services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game] && response.data.data.gameserver.query.server_name) {
            await path(reference, service, response.data.data.gameserver);
          };
        });

        await Promise.all(tasks).then(async () => {
          console.log('Online Finished:')
        });
      };

      const service = async (reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { gameserver(reference, response.data.data.services) };
        } catch (error) { console.log(error) };
      };

      const token = async (reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { service(reference) };
        } catch (error) { console.log(error) };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(async doc => {
        if (doc.data()) { token(doc.data()) };
      });
      setTimeout(loop, 180000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};