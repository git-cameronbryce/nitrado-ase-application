const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-search')
    .setDescription('Performs an in-game search action.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true))
    .addStringOption(option => option.setName('search-algorithm').setDescription('Algorithm to return usernames.').setRequired(true)
      .addChoices({ name: 'Type: Filter-Search', value: 'filter' })),

  async execute(interaction) {
    await interaction.deferReply();

    const input = {
      username: interaction.options.getString('username'),
      search: interaction.options.getString('search-algorithm'),
      guild: interaction.guild.id,
    };

    const unauthorized = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setDescription(`**Unauthorized Access**\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      return interaction.followUp({ embeds: [embed] });
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

      let output = '';
      let counter = 0;
      const gameserver = async (reference, services) => {
        const parse = async (query, { name, online, last_online }) => {
          if (counter < 5) {
            counter++
            online
              ? output += `\`🟢\` \`Player Online\`\n\`🔗\` ${query.server_name ? query.server_name : 'Data Fetch Error - API Outage'}\n\`🔗\` <t:${Math.floor(Date.parse(last_online) / 1000)}:f>\n\`🔗\` ${name}\n\n`
              : output += `\`🟠\` \`Player Offline\`\n\`🔗\` ${query.server_name ? query.server_name : 'Data Fetch Error - API Outage'}\n\`🔗\` <t:${Math.floor(Date.parse(last_online) / 1000)}:f>\n\`🔗\` ${name}\n\n`
          };
        };

        const filter = async (query, players) => {
          await players.forEach(async player => player.name.toLowerCase().includes(input.username) ? await parse(query, player) : null);
        };

        const players = async ({ service_id, query }) => {
          const url = `https://api.nitrado.net/services/${service_id}/gameservers/games/players`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await filter(query, response.data.data.players) };
        };

        const tasks = await services.map(async service => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) { await players(response.data.data.gameserver) };
          } catch (error) { null };
        });

        await Promise.all(tasks).then(async () => {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`${output}`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })

          return await interaction.followUp({ embeds: [embed] })
        });
      };

      const service = async (reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? gameserver(reference, response.data.data.services) : unauthorized();
        } catch (error) { unauthorized() };
      };

      const token = async (reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? service(reference) : unauthorized();
        } catch (error) { unauthorized() };
      };

      const reference = (await db.collection('ase-configuration').doc(input.guild).get()).data();
      reference ? await token(reference) : unauthorized();
    });
  }
};