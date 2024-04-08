const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const { Unauthorized, DatabaseCommandFailure, DatabaseCommandSuccess } = require('../utils/embeds.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ase-player-lookup')
    .setDescription('Performs an external player lookup.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const input = {
      username: interaction.options.getString('username'),
      guild: interaction.guild.id,
      admin: interaction.user.id
    };

    await interaction.guild.roles.fetch().then(async roles => {
      const role = roles.find(role => role.name === 'Obelisk Permission');

      if (!role || !interaction.member.roles.cache.has(role.id)) {
        return interaction.followUp({ embeds: [Unauthorized(role)], ephemeral: true });
      };

      const invalidPlayer = async () => {
        return await interaction.followUp({ embeds: [DatabaseCommandFailure] });
      }

      const validPlayer = async ({ admin, reason }) => {
        playerFound = true;
        return await interaction.followUp({ embeds: [DatabaseCommandSuccess(reason,admin)] });
      }

      playerFound = false
      const reference = (await db.collection('ase-player-banned').doc(input.guild).get()).data();
      Object.entries(reference).forEach(async ([player, doc]) => {
        player === input.username ? validPlayer(doc) : null;
      });

      if (!playerFound) { invalidPlayer() };
    });
  }
};