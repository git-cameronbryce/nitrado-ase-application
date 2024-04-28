const { ActionRowBuilder, Events, ModalBuilder, ChannelType, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, GatewayIntentBits } = require('discord.js');
const { xbox } = require('../../other/config.json');
const { db } = require('../../script');
const axios = require('axios');

const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      if (interaction.customId === 'gamertag-search') {
        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission' || role.name === 'AS:E Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            return interaction.reply({ embeds: [embed], ephemeral: true });
          };

          const modal = new ModalBuilder()
            .setCustomId('gamertag-modal')
            .setTitle('Obelisk Search Tooling');

          const row = new ActionRowBuilder()
            .addComponents(
              new TextInputBuilder()
                .setCustomId('gamertag-option').setLabel('Required Gamertag Input').setMinLength(0).setMaxLength(20)
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            );

          modal.addComponents(row);
          await interaction.showModal(modal);
        });
      };

      if (interaction.customId === 'gamertag-modal') {
        const identifier = interaction.fields.getTextInputValue('gamertag-option');

        let output = '';
        let counter = 0;
        await interaction.deferReply({ ephemeral: true });
        const gameserver = async (reference, services) => {
          const extraction = async (service, gameserver, players) => {

            players.forEach(async player => {
              try {
                if (player.name.toLowerCase().includes(identifier.toLowerCase()) && counter < 5) {
                  switch (player.online) {
                    case true:
                      output += `\`🟢\` \`Player Online\`\n${gameserver.query.server_name ? `\`🔗\` ${gameserver.query.server_name}` : '\`🔗\` Data Fetch Error - API Outage'}\n\`🔗\` <t:${Math.floor(Date.parse(player.last_online) / 1000)}:f>\n\`🔗\` ${player.name}\n\n`
                      counter++
                      break;

                    case false:
                      output += `\`🟠\` \`Player Offline\`\n${gameserver.query.server_name ? `\`🔗\` ${gameserver.query.server_name}` : '\`🔗\` Data Fetch Error - API Outage'}\n\`🔗\` <t:${Math.floor(Date.parse(player.last_online) / 1000)}:f>\n\`🔗\` ${player.name}\n\n`
                      counter++
                      break;

                    default:
                      break;
                  };
                };
              } catch (error) { null };
            });
          };

          const path = async (reference, service, gameserver) => {
            try {
              const url = `https://api.nitrado.net/services/${service.id}/gameservers/games/players`;
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              if (response.status === 200) { await extraction(service, gameserver, response.data.data.players) }
            } catch (error) { null };
          };

          const tasks = await services.map(async service => {
            try {
              const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              if (response.status === 200 && platforms[response.data.data.gameserver.game]) {
                await path(reference, service, response.data.data.gameserver);
              };
            } catch (error) { null };
          });

          await Promise.all(tasks).then(async () => {
            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Search Command Success**\nObelisk has filtered through each player.\nMatching items will be displayed below.\n\n${output}`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            await interaction.followUp({ embeds: [embed] })
          });
        };

        const service = async (reference) => {
          try {
            const url = 'https://api.nitrado.net/services';
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            response.status === 200 ? gameserver(reference, response.data.data.services) : null;
          } catch (error) { null };
        };

        const token = async (reference) => {
          try {
            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
            response.status === 200 ? service(reference) : null();
          } catch (error) { null };
        };

        const reference = (await db.collection('ase-configuration').doc(interaction.guild.id).get()).data();
        reference ? await token(reference) : null;
      }

      if (interaction.customId === 'username-search') {
        await interaction.deferReply({ ephemeral: true });

        await interaction.followUp({ content: 'Not implemented, yet.' })
      }
    });
  },
};