const { Events, Embed, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

process.on('unhandledRejection', (error) => console.error('error'));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {
      const gameserver = async (document, reference, services) => {
        if (!reference.join) { return };

        let output = '';
        let counter = 0;
        const extraction = async (document, reference, { url }) => {
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) {
            const regex = /.\d{4}.\d{2}.\d{2}.\d{2}.\d{2}.\d{2}.\d{3}..\d{3}.(\d{4}.\d{2}.\d{2}.\d{2}.\d{2}.\d{2}).\s+(\w{0,})\s*(\w{0,})\s*\w{0,}\s*ARK/g;

            let match;
            while ((match = regex.exec(response.data)) !== null && counter < 10) {
              const [string, date, gamertag, condition] = match;

              const [datePart, timePart] = date.split('_');
              const dateTimeString = `${datePart.replace(/\./g, '-')}T${timePart.replace(/\./g, ':')}`;
              const unixTimestamp = Math.floor(new Date(dateTimeString).getTime() / 1000);

              switch (condition) {
                case 'joined':
                  output += `**Obelisk AS:E Gameserver**\n\`🔐\` 31.214.239.131:10035\n\n<t:${unixTimestamp}:F>\n\`\`\`\n🟢 ${gamertag} joined your server!\n\`\`\`\n`;
                  counter++;
                  break;
                case 'left':
                  output += `**Obelisk AS:E Gameserver**\n\`🔐\` 31.214.239.131:10035\n\n<t:${unixTimestamp}:F>\n\`\`\`\n🟠 ${gamertag} left your server!\n\`\`\`\n`;
                  counter++;
                  break;

                default:
                  break;
              };
            };
          };
        };

        const path = async (document, reference, service, { game_specific: { path } }) => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers/file_server/download?file=${path}/ShooterGame/Saved/Logs/ShooterGame.log`;
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) { await extraction(document, reference, response.data.data.token); };
          } catch (error) { null };
        };

        const tasks = await services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game] && response.data.data.gameserver.query.server_name) {
            await path(document, reference, service, response.data.data.gameserver);
          };
        });

        await Promise.all(tasks).then(async () => {
          const entries = Object.entries(reference.join);
          entries.forEach(async entry => {
            const channel = await client.channels.fetch(entry[1]);
            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setFooter({ text: `Tip: Contact support if there are issues.` })
              .setDescription(`${output}`);

            await channel.send({ embeds: [embed] });
          });
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