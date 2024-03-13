const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {
      if (!interaction.isButton()) return;

      if (interaction.customId.startsWith('overwrite-chat-thread')) {
        const identifier = interaction.customId.split('-')[3];
        console.log(identifier)
        const deletion = async (item) => {
          await db.collection('ase-configuration').doc(interaction.guild.id).update({
            [`chat.${item[0]}`]: FieldValue.delete()
          }).then(async () => {
            const thread = await interaction.client.channels.fetch(identifier);
            await thread.delete();
          });
        };

        const parse = async (reference) => {
          const chat = reference.chat ? Object.entries(reference.chat) : [];
          const item = chat.find(item => item[1] == identifier);

          item ? await deletion(item) : console.log('Not located: Chat');
        };

        const reference = (await db.collection('ase-configuration').doc(interaction.guild.id).get()).data();
        reference ? await parse(reference) : unauthorized();
      };

      if (interaction.customId.startsWith('overwrite-admin-thread')) {
        const identifier = interaction.customId.split('-')[3];

        const deletion = async (item) => {
          await db.collection('ase-configuration').doc(interaction.guild.id).update({
            [`admin.${item[0]}`]: FieldValue.delete(),
          }).then(async () => {
            const thread = await interaction.client.channels.fetch(identifier);
            await thread.delete();
          });
        };

        const parse = async (reference) => {
          const admin = reference.admin ? Object.entries(reference.admin) : [];

          const item = admin.find(item => item[1] == identifier);

          item ? await deletion(item) : console.log('Not located: Admin');
        };

        const reference = (await db.collection('ase-configuration').doc(interaction.guild.id).get()).data();
        reference ? await parse(reference) : unauthorized();
      };
    });
  },
};
