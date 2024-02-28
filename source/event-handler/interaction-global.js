const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

const platforms = { arkxb: true, arkps: true, arkse: true };

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {
      await interaction.deferReply();

      if (interaction.customId === 'cluster-command') {
        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            return interaction.followUp({ embeds: [embed], ephemeral: true });
          };

          let filtered = 0;
          const validService = async (services) => {
            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Restart Cluster')
                  .setCustomId('restart-cluster')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(false),

                new ButtonBuilder()
                  .setLabel('Stop Cluster')
                  .setCustomId('stop-cluster')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(false),
              );

            services.forEach(service => {
              if (platforms[service.details.folder_short] && service.status !== 'suspended') { filtered++ };
            });

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\`🟠\` \`${filtered} Gameservers Pending\`\n\n**Additional Information**\nDelete this message to return.`)

            await interaction.followUp({ embeds: [embed], components: [button], ephemeral: false });
          }

          const validToken = async (nitrado) => {
            const url = 'https://api.nitrado.net/services';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            const services = response.data.data.services;
            response.status === 200 ? validService(services) : invalidService()
          }

          const validDocument = async ({ nitrado }) => {
            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            response.status === 200 ? validToken(nitrado) : console.log('Invalid token'), null;
          }

          const reference = (await db.collection('ase-configuration').doc(interaction.guild.id).get()).data()
          reference ? validDocument(reference) : console.log('Error')
        });
      };

      if (interaction.customId === 'restart-cluster') {
        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            return interaction.followUp({ embeds: [embed], ephemeral: true });
          };

          const message = await interaction.message;

          const success = async (data) => {
            await interaction.deferReply()

            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Restart Cluster')
                  .setCustomId('restart-cluster')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true),

                new ButtonBuilder()
                  .setLabel('Stop Cluster')
                  .setCustomId('stop-cluster')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\`🟢\` \`${data.length} Gameservers Restarting\`\n\n**Additional Information**\nDeletion:  <t:${Math.floor(Date.now() / 1000) + 15}:R>`)

            const info = await interaction.followUp({ content: 'Data Fetch Success - API Online', ephemeral: false })
            await message.edit({ embeds: [embed], components: [button] })
              .then(() => setTimeout(() => { message.delete(); info.delete(); }, 15000));
          };

          const validService = async (nitrado, services) => {
            const promise = await services.map(async service => {
              if (platforms[service.details.folder_short] && service.status !== 'suspended') {
                const url = `https://api.nitrado.net/services/${service.id}/gameservers/restart`;
                return axios.post(url, { message: 'Obelisk Cluster-Wide Restart' }, { headers: { 'Authorization': nitrado.token } });
              };
            });

            const data = [];
            const responses = await Promise.all(promise);
            responses.forEach(responses => { data.push(responses.status) });
            success(data)
          };

          const validToken = async (nitrado) => {
            const url = 'https://api.nitrado.net/services';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            const services = response.data.data.services;
            response.status === 200 ? validService(nitrado, services) : invalidService()
          };

          const validDocument = async ({ nitrado }) => {
            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            response.status === 200 ? validToken(nitrado) : console.log('Invalid token'), null;
          };

          const reference = (await db.collection('configuration').doc(interaction.guild.id).get()).data()
          reference ? validDocument(reference) : console.log('Error')
        });
      };

      if (interaction.customId === 'stop-cluster') {
        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            return interaction.followUp({ embeds: [embed], ephemeral: true });
          };

          const message = await interaction.message;

          const success = async (data) => {
            await interaction.deferReply()

            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Restart Cluster')
                  .setCustomId('restart-cluster')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true),

                new ButtonBuilder()
                  .setLabel('Stop Cluster')
                  .setCustomId('stop-cluster')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\`🟢\` \`${data.length} Gameservers Stopping\`\n\n**Additional Information**\nDeletion:  <t:${Math.floor(Date.now() / 1000) + 15}:R>`)

            const info = await interaction.followUp({ content: 'Data Fetch Success - API Online', ephemeral: false })
            await message.edit({ embeds: [embed], components: [button] })
              .then(() => setTimeout(() => { message.delete(); info.delete(); }, 13000));
          };

          const validService = async (nitrado, services) => {
            const promise = await services.map(async service => {
              if (platforms[service.details.folder_short] && service.status !== 'suspended') {
                const url = `https://api.nitrado.net/services/${service.id}/gameservers/stop`;
                return axios.post(url, { message: 'Obelisk Cluster-Wide Stop' }, { headers: { 'Authorization': nitrado.token } });
              };
            });

            const data = [];
            const responses = await Promise.all(promise);
            responses.forEach(responses => { data.push(responses.status) });
            success(data)
          };

          const validToken = async (nitrado) => {
            const url = 'https://api.nitrado.net/services';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            const services = response.data.data.services;
            response.status === 200 ? validService(nitrado, services) : invalidService()
          };

          const validDocument = async ({ nitrado }) => {
            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            response.status === 200 ? validToken(nitrado) : console.log('Invalid token'), null;
          };

          const reference = (await db.collection('configuration').doc(interaction.guild.id).get()).data()
          reference ? validDocument(reference) : console.log('Error')
        });
      };

      if (interaction.customId === 'auto-maintanance') {
        // Add in later version...
      };
    });
  },
};