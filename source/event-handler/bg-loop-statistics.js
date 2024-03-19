const { Events } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      const gameserver = async (nitrado, statistics, services) => {
        let players = 0, active = 0, outage = 0;
        const parse = async (gameserver) => {
          const { query, status } = gameserver;
          if (status === 'suspended') { return };

          if (query.player_current) { players += query.player_current };
          if (status === 'started') { active++ }
          if (status === 'stopped') { outage++ }
        };

        const tasks = await services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game]) {
            await parse(response.data.data.gameserver);
          }
        })

        await Promise.all(tasks).then(async () => {
          try {

            const playerVoice = await client.channels.fetch(statistics.players);
            const activeVoice = await client.channels.fetch(statistics.active);
            const outageVoice = await client.channels.fetch(statistics.outage);

            await playerVoice.setName(`Active: ${players} Players`);
            await activeVoice.setName(`Active: ${active} Servers`);
            await outageVoice.setName(`Outage: ${outage} Servers`);
          } catch (error) { null };
        })
      };

      const service = async (nitrado, statistics) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        if (response.status === 200) gameserver(nitrado, statistics, response.data.data.services);
      };

      const token = async ({ nitrado, statistics }) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          if (response.status === 200) service(nitrado, statistics);
        } catch (error) { null };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 60000)
    };
    loop().then(() => console.log('Loop started:'));
  },
};