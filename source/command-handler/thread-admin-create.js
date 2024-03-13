const { SlashCommandBuilder, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

const platforms = { arkxb: true, arkps: true, arkse: true };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ase-create-admin-logging')
    .setDescription('Performs an in-game player action.')
    .addNumberOption(option => option.setName('identifier').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const input = {
      identifier: interaction.options.getNumber('identifier'),
      guild: interaction.guild.id,
      admin: interaction.user.id
    };

    await interaction.guild.roles.fetch().then(async roles => {
      const role = roles.find(role => role.name === 'Obelisk Permission');

      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return interaction.followUp({ embeds: [embed], ephemeral: true });
      };

      const unauthorized = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Unauthorized Access**\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return interaction.followUp({ embeds: [embed] });
      };

      const invalid = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Thread Creation Failure**\nMissing forum channel in database.\nReinstall the token to assign it.\n\`/ase-setup-account\``)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return interaction.followUp({ embeds: [embed], ephemeral: true });
      }

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
          .setDescription(`**Firebase: Duplicate Entry Detected**\nObelisk has detected a duplicate entry.\nLogging is already setup for this server.\n[\`📑: Current Thread Hyperlink\`](https://discord.com/channels/${input.guild}/${thread})\n\n**Additional Information**\nWould you like to overwrite this entry?`)
          .setFooter({ text: 'Proceeding will overwrite existing thread. \nTranscripts of thread will not be saved.' })

        await interaction.followUp({ embeds: [embed], components: [button] });
      };

      const outage = async () => {
        console.log('Data Fetch Error - API Outage')
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
        } catch (error) { unauthorized() };
      };

      const reference = (await db.collection('ase-configuration').doc(input.guild).get()).data();
      reference ? await token(reference) : unauthorized();
    })
  }
};

/*
Error: console.log(query); {}
*/