const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../../script');
const axios = require('axios');

const platforms = { arkxb: true };
const matches = new Set();

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {

    async function loop() {
      const platforms = { arkxb: true, arkps: true };

      const gameserver = async (nitrado, protections, services) => {
        const verify = async (player) => {
          matches.add(player.name);
          if (!matches.has(player.name)) {
            console.log(player.name);
          }
        };

        const filter = async (service, gameserver) => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers/games/players`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          response.data.data.players.forEach(async player => {
            if (player.online) { await verify(player) }
          });
        };

        const tasks = await services.map(async service => {
          if (platforms[service.details.folder_short]) {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
            if (response.status === 200 && response.data.data.gameserver.status === 'started') { await filter(service, response.data.data.gameserver) };
          };
        });
      };

      const service = async (nitrado, protections) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        const services = response.data.data.services;
        response.status === 200 ? gameserver(nitrado, protections, services) : invalidService()
      };

      const token = async ({ nitrado, protections }) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? service(nitrado, protections) : console.log('Invalid token');
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