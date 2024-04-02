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
      const regex = /.\d{4}.\d{2}.\d{2}.\d{2}.\d{2}.\d{2}.\d{3}..\d{3}.(\d{4}.\d{2}.\d{2}.\d{2}.\d{2}.\d{2}).\s+(\w{0,})\s*(\w{0,})\s*\w{0,}\s*ARK/g;
      const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

      const gameserver = async (document, reference, services) => {
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
              } catch (error) { null };
            };
          });


        };

        const path = async (document, reference, service) => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers/games/players`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await extraction(service, response.data.data.players) }
        };

        const tasks = await services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game] && response.data.data.gameserver.query.server_name) {
            await path(document, reference, service, response.data.data.gameserver);
          };
        });

        await Promise.all(tasks).then(async () => {
          console.log('Online Finished:')
        });
      };

      const service = async (document, reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? gameserver(document, reference, response.data.data.services) : unauthorized();
        } catch (error) { unauthorized() };
      };

      const token = async (document, reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? service(document, reference) : unauthorized();
        } catch (error) { unauthorized() };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.id, doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 60000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};