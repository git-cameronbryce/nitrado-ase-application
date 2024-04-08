const { Events } = require('discord.js');
const { adminExtractionLogic } = require('./logging-logic/module-admin');
const { chatExtractionLogic } = require('./logging-logic/module-chat');
const { joinExtractionLogic } = require('./logging-logic/module-join');
const rateLimit = require('axios-rate-limit');
const { db } = require('../../script');
const axios = require('axios');

const platforms = { arkxb: true, arkps: true, arkse: true };
const api = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 0o250 });

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {
      const adminExtraction = async (reference, service, response) => {
        await adminExtractionLogic(reference, service, response, client);
      };
      const chatExtraction = async (reference, service, response) => {
        await chatExtractionLogic(reference, service, response, client);
      };
      const joinExtraction = async (reference, service, response) => {
        await joinExtractionLogic(reference, service, response, client);
      };

      const gameserver = async (reference, services) => {
        const extraction = async (reference, service, { url }) => {
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (!response.status === 200) { return };

          if (Object.keys(reference.admin)) {
            await adminExtraction(reference, service, response.data);
          };
          if (Object.keys(reference.chat)) {
            await chatExtraction(reference, service, response.data);
          };
          if (Object.keys(reference.join)) {
            await joinExtraction(reference, service, response.data);
          };
        };

        const path = async (reference, service, { game_specific: { path } }) => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers/file_server/download?file=${path}/ShooterGame/Saved/Logs/ShooterGame.log`;
            const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) { await extraction(reference, service, response.data.data.token) };
          } catch (error) { null };
        };

        const tasks = await services.map(async service => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
            const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200 && platforms[response.data.data.gameserver.game] && response.data.data.gameserver.query.server_name) {
              await path(reference, service, response.data.data.gameserver);
            };
          } catch (error) { null };
        });

        await Promise.all(tasks).then(async () => {
          console.log('Logging Finished:')
        });
      };

      const service = async (reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { gameserver(reference, response.data.data.services) };
        } catch (error) { null };
      };

      const token = async (reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { service(reference) };
        } catch (error) { null };
      };

      const reference = await db.collection('ase-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 750000);
    };
    // loop().then(() => console.log('Loop started:'));
  },
};