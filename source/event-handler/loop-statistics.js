const { Events } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      let players = 0, active = 0, outage = 0;
      const platforms = { arkxb: true, arkps: true, arkse: true };
      const gameserver = async (nitrado, statistics, services) => {
        const playerThread = await client.channels.fetch(statistics.players);
        const activeThread = await client.channels.fetch(statistics.active);
        const outageThread = await client.channels.fetch(statistics.outage);

        const tasks = await services.map(async service => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
            const { status, query, game } = response.data.data.gameserver;

            if (platforms[game] && service.status !== 'suspended') {
              if (status === 'started' && query) { players += query.player_current; };
              if (status === 'started') { active++; };
              if (status !== 'started') { outage++ };
            };
          } catch (error) { console.log(error) };
        });

        await Promise.all(tasks).then(async () => {
          try {
            await outageThread.setName(`Offline: ${outage} Servers`);
            await playerThread.setName(`Active: ${players} Players`);
            await activeThread.setName(`Active: ${active} Servers`);

            console.log(players, active, outage);

          } catch (error) { if (error.code === 50013) { null } };
        });
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
      setTimeout(loop, 10000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};