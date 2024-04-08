const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');
const axios = require('axios');
const { Unauthorized, NoAccount, GameCommandSuccess, GameServerActionSuccess } = require('../utils/embeds.js');

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
      const role = roles.find(role => role.name === 'Obelisk Permission');

      if (!role || !interaction.member.roles.cache.has(role.id)) {
        return interaction.followUp({ embeds: [Unauthorized(role)], ephemeral: true });
      };

      const unauthorized = async () => {
        return interaction.followUp({ embeds: [NoAccount()] });
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
          await interaction.followUp({ embeds: [GameCommandSuccess] })

          try {
 
            const channel = await interaction.client.channels.fetch(reference.audits.player);
            await channel.send({ embeds: [GameServerActionSuccess(input,interaction)] });

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