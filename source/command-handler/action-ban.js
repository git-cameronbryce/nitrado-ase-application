const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-ban')
    .setDescription('Performs an in-game player action.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Required to submit ban action.').setRequired(true)
      .addChoices({ name: 'Breaking Rules', value: 'breaking rules' }, { name: 'Cheating', value: 'cheating' }, { name: 'Behavior', value: 'behavior' }, { name: 'Meshing', value: 'meshing' }, { name: 'Other', value: 'other reasons' })),

  async execute(interaction) {
    const platforms = { arkxb: true, arkps: true, arkse: true };
    await interaction.deferReply();

    const input = {
      username: interaction.options.getString('username'),
      reason: interaction.options.getString('reason'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    let success = 0;
    const gameserver = async (reference, services) => {
      const action = async (service) => {
        try {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers/games/banlist`;
          const response = await axios.post(url, { identifier: input.username }, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? success++ : unauthorized();
        } catch (error) { if (error.response.data.message === "Can't add the user to the banlist.") { success++ }; };
      };

      const filter = async (service) => {
        platforms[service.details.folder_short] ? await action(service) : console.log('Incompatible gameserver.')
      };

      const tasks = await services.map(async service => await filter(service));

      await Promise.all(tasks).then(async () => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Game Command Success**\nGameserver action completed.\nExecuted on \`${success}\` of \`${tasks.length}\` servers.\n<t:${Math.floor(Date.now() / 1000)}:f>`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/CzGfRzv.png')

        await interaction.followUp({ embeds: [embed] })
          .then(async () => {
            if (success) {
              await db.collection('ase-player-banned').doc(input.guild).set({
                [input.username]: { admin: input.admin, reason: input.reason }
              }, { merge: true });
            };
          });
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