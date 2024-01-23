const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-unwhitelist')
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

    const unauthorized = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setDescription(`**Unauthorized Access**\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      return interaction.followUp({ embeds: [embed] });
    };

    let success = 0;
    const gameserver = async (reference, services) => {
      const action = async (service) => {
        try {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers/games/whitelist`;
          const response = await axios.delete(url, { headers: { 'Authorization': reference.nitrado.token }, data: { identifier: input.username } });
          response.status === 200 ? success++ : unauthorized();
          console.log(response.data.data.message);
        } catch (error) { if (error.response.data.message === "Can't remove the user from the whitelist.") { success++ }; };
      };

      const filter = async (service) => {
        platforms[service.details.folder_short] ? await action(service) : console.log('Incompatible gameserver.')
      };

      const tasks = await services.map(async service => await filter(service));

      await Promise.all(tasks).then(async () => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Game Command Success**\nGameserver action completed.\nExecuted on \`${success}\` of \`${action.length}\` servers.\n<t:${Math.floor(Date.now() / 1000)}:f>`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/CzGfRzv.png')

        await interaction.followUp({ embeds: [embed] })
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

    const reference = (await db.collection('configuration').doc(input.guild).get()).data();
    reference ? await token(reference) : unauthorized();
  }
};