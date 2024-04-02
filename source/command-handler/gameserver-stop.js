const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ase-gameserver-stop')
    .setDescription('Performs a stopping action on selected server.')
    .addNumberOption(option => option.setName('identifier').setDescription('Performs server action, list the exact identification number.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

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
          .setDescription(`** Unauthorized Access **\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      };

      const success = async () => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Server Command Success**\nBackup has been automatically collected.\nNitrado uptime is required to save fully.\n\`🟢\` \`1 Gameserver Stopping\`\n\n**Additional Information**\nNo negative effects to this action.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      };

      let valid = false;
      const gameserver = async (reference, services) => {
        const tasks = services.map(async service => {
          if (input.identifier === service.id) {
            const url = `https://api.nitrado.net/services/${input.identifier}/gameservers/stop`;
            const response = await axios.post(url, { message: `Obelisk Manual Stop: ${interaction.user.id}` }, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) {
              console.log(`Gameserver stopping: ${response.status}`);
              valid = true, await success();
            };
          };
        });

        await Promise.all(tasks).then(async () => {
          if (valid) {
            try {
              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setFooter({ text: `Tip: Contact support if there are issues.` })
                .setDescription(`**Server Command Logging**\nGameserver action completed.\n\`/ase-gameserver-stop\`\n\`${input.identifier}\`\n\n**ID: ${interaction.user.id}**`);

              const channel = await interaction.client.channels.fetch(reference.audits.server);
              await channel.send({ embeds: [embed] });

            } catch (error) { console.log('Missing access.') };

          } else { await interaction.followUp({ content: 'Invalid service identifier!' }) }
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