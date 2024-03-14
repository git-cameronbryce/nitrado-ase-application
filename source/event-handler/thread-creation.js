const { ActionRowBuilder, ChannelType, Events, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      if (interaction.customId === 'admin-thread-modal') {
        const modal = new ModalBuilder()
          .setCustomId('admin-modal')
          .setTitle('Admin Logging Modal');

        const row = new ActionRowBuilder()
          .addComponents(
            new TextInputBuilder()
              .setCustomId('admin-option').setLabel('Required Service Identifier').setMinLength(0).setMaxLength(10)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          );

        modal.addComponents(row);
        await interaction.showModal(modal);
      };

      if (interaction.customId === 'chat-thread-modal') {
        const modal = new ModalBuilder()
          .setCustomId('chat-modal')
          .setTitle('Chat Logging Modal');

        const row = new ActionRowBuilder()
          .addComponents(
            new TextInputBuilder()
              .setCustomId('chat-option').setLabel('Required Service Identifier').setMinLength(0).setMaxLength(10)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          );

        modal.addComponents(row);
        await interaction.showModal(modal);
      };

      if (interaction.customId === 'admin-modal') {
        await interaction.deferReply();

        const input = {
          identifier: interaction.fields.getTextInputValue('admin-option'),
          guild: interaction.guild.id,
          admin: interaction.user.id
        };

        const duplicate = async (item) => {
          const [service, thread] = item;

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Overwrite')
                .setCustomId(`overwrite-admin-thread-${thread}`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),

              new ButtonBuilder()
                .setURL('https://discord.gg/jee3ukfvVr')
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Firebase: Duplicate Entry Detected**\nObelisk has detected a duplicate entry.\nLogging is already setup for this server.\n[\`📑: Admin Thread Hyperlink\`](https://discord.com/channels/${input.guild}/${thread})\n\n**Additional Information**\nWould you like to overwrite this entry?`)
            .setFooter({ text: 'Proceeding will overwrite existing thread. \nTranscripts of thread will not be saved.' })

          await interaction.followUp({ embeds: [embed], components: [button] });
        };

        const gameserver = async (reference) => {
          const thread = async (service_id, query) => {
            if (!query.server_name) { return outage() };

            const adminForum = await interaction.client.channels.fetch(reference.forum.admin);

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Admin Logging Synchronized**\nEverything has been setup correctly. \nIDs are initializing in our database. \n\n**Logging Release Schedule**\n<t:1707627600:f>\n\nService #: \`${service_id}\``)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })


            const adminThread = await adminForum.threads.create({
              name: `${query.server_name} - ${service_id}`,
              type: ChannelType.PrivateThread,
              message: { embeds: [embed] }
            });

            const data = { 'admin': { [input.identifier]: adminThread.id } };
            await db.collection('ase-configuration').doc(input.guild).set(data, { merge: true }).then(async () => {
              console.log('Logging thread installed.')
            });
          }

          const path = async (reference, { service_id, query }) => {
            if (reference.forum.admin) {
              const admin = reference.admin ? Object.entries(reference.admin) : [];

              const item = admin.find(item => item[0] == input.identifier);
              item ? duplicate(item) : thread(service_id, query)
            };
          };

          try {
            const url = `https://api.nitrado.net/services/${input.identifier}/gameservers`;
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) { await path(reference, response.data.data.gameserver) };
          } catch (error) { console.log(error), console.log('Incorrect Identifier') }
        };

        const service = async (reference) => {
          try {
            const url = 'https://api.nitrado.net/services';
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } })
            response.status === 200 ? gameserver(reference, response.data.data.services) : unauthorized()
          } catch (error) { unauthorized() };
        };

        const token = async (reference) => {
          try {
            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } })
            response.status === 200 ? service(reference) : unauthorized();
          } catch (error) { console.log(error) };
        };

        const reference = (await db.collection('ase-configuration').doc(input.guild).get()).data();
        reference ? await token(reference) : unauthorized();
      };

      if (interaction.customId === 'chat-modal') {
        await interaction.deferReply();

        const input = {
          identifier: interaction.fields.getTextInputValue('chat-option'),
          guild: interaction.guild.id,
          chat: interaction.user.id
        };

        const duplicate = async (item) => {
          const [service, thread] = item;

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Overwrite')
                .setCustomId(`overwrite-chat-thread-${thread}`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),

              new ButtonBuilder()
                .setURL('https://discord.gg/jee3ukfvVr')
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Firebase: Duplicate Entry Detected**\nObelisk has detected a duplicate entry.\nLogging is already setup for this server.\n[\`📑: Chat Thread Hyperlink\`](https://discord.com/channels/${input.guild}/${thread})\n\n**Additional Information**\nWould you like to overwrite this entry?`)
            .setFooter({ text: 'Proceeding will overwrite existing thread. \nTranscripts of thread will not be saved.' })

          await interaction.followUp({ embeds: [embed], components: [button] });
        };

        const gameserver = async (reference) => {
          const thread = async (service_id, query) => {
            if (!query.server_name) { return outage() };

            const chatForum = await interaction.client.channels.fetch(reference.forum.chat);

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Chat Logging Synchronized**\nEverything has been setup correctly. \nIDs are initializing in our database. \n\n**Logging Release Schedule**\n<t:1707627600:f>\n\nService #: \`${service_id}\``)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })


            const chatThread = await chatForum.threads.create({
              name: `${query.server_name} - ${service_id}`,
              type: ChannelType.PrivateThread,
              message: { embeds: [embed] }
            });

            const data = { 'chat': { [input.identifier]: chatThread.id } };
            await db.collection('ase-configuration').doc(input.guild).set(data, { merge: true }).then(async () => {
              console.log('Logging thread installed.')
            });
          }

          const path = async (reference, { service_id, query }) => {
            if (reference.forum.chat) {
              const chat = reference.chat ? Object.entries(reference.chat) : [];

              const item = chat.find(item => item[0] == input.identifier);
              item ? duplicate(item) : thread(service_id, query)
            };
          };

          try {
            const url = `https://api.nitrado.net/services/${input.identifier}/gameservers`;
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) { await path(reference, response.data.data.gameserver) };
          } catch (error) { console.log(error), console.log('Incorrect Identifier') }
        };

        const service = async (reference) => {
          try {
            const url = 'https://api.nitrado.net/services';
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } })
            response.status === 200 ? gameserver(reference, response.data.data.services) : unauthorized()
          } catch (error) { unauthorized() };
        };

        const token = async (reference) => {
          try {
            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } })
            response.status === 200 ? service(reference) : unauthorized();
          } catch (error) { console.log(error) };
        };

        const reference = (await db.collection('ase-configuration').doc(input.guild).get()).data();
        reference ? await token(reference) : unauthorized();
      };

    });
  },
};
