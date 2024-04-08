const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { SystemSetup } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ase-setup-account')
    .setDescription('Follow the onboarding process to initialize your account.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Setup Token')
          .setCustomId('setup-token')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setURL('https://discord.gg/jee3ukfvVr')
          .setLabel('Support Server')
          .setStyle(ButtonStyle.Link),
      );

    

    await interaction.reply({ embeds: [SystemSetup], components: [button] });
  }
};