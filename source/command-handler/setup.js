const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

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

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setDescription(`**Account Setup & Overview**\nHello, thank you for choosing our service. Below, you'll have the option to link your token, along with a [video preview](https://i.imgur.com/a3b9GkZ.mp4) to display the process.\n\n**Additional Information**\nEnsure this guild is a [community](https://i.imgur.com/q8ElPKj.mp4) server, otherwise, the bot will not be able to connect properly. \n\n**[Partnership & Information](https://nitra.do/obeliskdevelopment "Nitrado Partner Link")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
      .setFooter({ text: 'Tip: Contact support if there are issues.' })
      .setImage('https://i.imgur.com/2ZIHUgx.png')

    await interaction.reply({ embeds: [embed], components: [button] });
  }
};