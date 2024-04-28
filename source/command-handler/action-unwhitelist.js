const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ase-player-unwhitelist')
    .setDescription('Performs an in-game player action.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    const platforms = { arkxb: true, arkps: true, arkse: true };
    await interaction.deferReply();

    const input = {
      username: interaction.options.getString('username'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    input.username = input.username.includes('#') ? input.username.replace('#', '') : input.username;

    await interaction.guild.roles.fetch().then(async roles => {
      const role = roles.find(role => role.name === 'Obelisk Permission' || role.name === 'AS:E Obelisk Permission');

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

      let current = 0, success = 0;
      const gameserver = async (reference, services) => {
        const action = async (service) => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers/games/whitelist`;
            const response = await axios.delete(url, { headers: { 'Authorization': reference.nitrado.token }, data: { identifier: input.username } });
            response.status === 200 ? success++ : unauthorized();
          } catch (error) { if (error.response.data.message === "Can't remove the user from the whitelist.") { success++ }; };
        };

        const filter = async (service) => {
          platforms[service.details.folder_short] && service.status !== 'suspended' ? (await action(service), current++) : console.log('Incompatible gameserver.')
        };

        const tasks = await services.map(async service => await filter(service));

        await Promise.all(tasks).then(async () => {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Game Command Success**\nGameserver action completed.\nExecuted on \`${success}\` of \`${current}\` servers.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setThumbnail('https://i.imgur.com/CzGfRzv.png')

          await interaction.followUp({ embeds: [embed] })

          try {
            if (success > 0) {
              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setFooter({ text: `Tip: Contact support if there are issues.` })
                .setDescription(`**Player Command Logging**\nGameserver action completed.\nExecuted on \`${success}\` of \`${current}\` servers.\n\`/ase-player-unwhitelist\`\n\n${input.username} was unwhitelisted.`)

              const channel = await interaction.client.channels.fetch(reference.audits.player);
              await channel.send({ embeds: [embed] });
            }
          } catch (error) { console.log('Missing access.') }
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