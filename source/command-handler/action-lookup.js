const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');

process.on('unhandledRejection', (error) => console.error(error));

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
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return interaction.followUp({ embeds: [embed], ephemeral: true });
      };

      const invalidPlayer = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Database Command Failure**\nQueried player data not stored.\nBan information isn\'t stored.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/PCD2pG4.png')

        return await interaction.followUp({ embeds: [embed] });
      }

      const validPlayer = async ({ admin, reason }) => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Database Command Success**\nPlayer information retrieved.\n\nRemoved for ${reason}.\n__ID: ${admin}__`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/CzGfRzv.png')

        playerFound = true;
        return await interaction.followUp({ embeds: [embed] });
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