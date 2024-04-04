const { Events, Embed, EmbedBuilder } = require('discord.js');
const { db } = require('../../script');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error('error'));

const set = new Set();

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {
      const regex = /\[\d{0,}\.\d{0,}\.\d{0,}\-\d{0,}\.\d{0,}\.\d{0,}\:\d{0,}\]\[([\d\s]+)\]\d{0,}\.\d{0,}\.\d{0,}\_\d{0,}\.\d{0,}\.\d{0,}\:\sTribe\s([\w\d\s]+)\,\s\w{0,}\s(\d{0,})\:\s[\w\d\s\,]+\:\d{0,}\:\d{2}\:\s([\w\d]+)\s[\w\d\s\-\(\)]+\[[\w\d\s\.\-\:]+]\[([\d\s]+)\][\w\s]+\:\s(\d{0,})/g;
      const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

      const players = [];
      const gameserver = async (document, reference, services) => {
        const playerRef = (await db.collection('ase-collection').doc(document).get()).data();

        if (!playerRef) { return };
        Object.entries(playerRef).forEach(player => players.push(player[1].username));

        const extraction = async (document, reference, service, { url }) => {
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (!response.status === 200) { return };

          let counter = 0;
          while ((result = regex.exec(response.data)) !== null) {
            const [string, conditionOne, tribeName, tribeIdentifier, playerUsername, conditionTwo, playerIdentifier] = result;

            if (!conditionOne && !conditionTwo) { return };
            players.push({ username: playerUsername, identifier: playerIdentifier });
          };
        };

        const path = async (document, reference, service, { game_specific: { path } }) => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers/file_server/download?file=${path}/ShooterGame/Saved/Logs/ShooterGame.log`;
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) { await extraction(document, reference, service, response.data.data.token); };
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

        });
      };

      const service = async (document, reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? gameserver(document, reference, response.data.data.services) : unauthorized();
        } catch (error) { null };
      };

      const token = async (document, reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? service(document, reference) : unauthorized();
        } catch (error) { null };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.id, doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 180000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};