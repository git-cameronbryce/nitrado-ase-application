const { ActionRowBuilder, Events, ModalBuilder, ChannelType, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      try {
        if (interaction.customId === 'setup-token') {
          const modal = new ModalBuilder()
            .setCustomId('token-modal')
            .setTitle('Nitrado Token Verification');

          const row = new ActionRowBuilder()
            .addComponents(
              new TextInputBuilder()
                .setCustomId('token-option').setLabel('Required Nitrado Token').setMinLength(50).setMaxLength(150)
                .setPlaceholder('...oAg66TcQYUnYXBQn17A161-N86cN5jWDp7')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            );

          modal.addComponents(row);
          await interaction.showModal(modal);
        }

        if (interaction.customId === 'token-modal') {
          const invalidToken = async () => {
            await interaction.reply({ content: 'Setup failure, ensure you follow provided steps above.', ephemeral: true });
          }

          const validToken = async ({ token }) => {
            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Continue Installation')
                  .setCustomId('continue-installation')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(false),

                new ButtonBuilder()
                  .setURL('https://donate.stripe.com/4gwbJm39u6oD3YcaEF')
                  .setLabel('Donation')
                  .setStyle(ButtonStyle.Link),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Token Creation & Overview**\nFor those interested in supporting our development directly, consider donating or upgrading to our paid version after installation.\n\n**Additional Information**\nWe balance stability then features, in that order. The core of our service is free, but the resource and request-heavy features will require payment. \n\n**[Partnership & Information](https://nitra.do/obeliskdevelopment \"Nitrado Partner Link\")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setImage('https://i.imgur.com/2ZIHUgx.png')

            await interaction.reply({ embeds: [embed], components: [button], ephemeral: true }).then(async () => {
              await db.collection('ase-configuration').doc(interaction.guild.id)
                .set({ ['nitrado']: { token: token } }, { merge: true })
            });
          };

          try {
            const nitrado = { token: interaction.fields.getTextInputValue('token-option') };

            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
            response.status === 200 && interaction.guild.features.includes('COMMUNITY') && response.data.data.token.scopes[0] === 'service'
              ? validToken(nitrado) : invalidToken();

          } catch (error) { invalidToken(), null };
        };

        if (interaction.customId === 'continue-installation') {
          const installation = await interaction.reply({ content: 'Installing...', ephemeral: true });

          const roles = await interaction.guild.roles.fetch();
          const action = roles.map(async role => role.name === 'Obelisk Permission' ? await role.delete() : null);
          try { await Promise.all(action) } catch (error) { return await installation.edit({ content: 'In your settings, move the bot role above the newly generated permission role.', ephemeral: true }) };

          await interaction.guild.roles.create({
            name: 'Obelisk Permission',
            color: '#ffffff',
          }).then(() => console.log('Role created...'));

          const permissions = [{
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          }];

          const statistics = await interaction.guild.channels.create({
            name: `AS:E Cluster Statistics`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const statisticsPlayers = await interaction.guild.channels.create({
            name: 'Active: 0 Players',
            type: ChannelType.GuildVoice,
            permissionOverwrites: permissions,
            parent: statistics
          });

          const statisticsActive = await interaction.guild.channels.create({
            name: 'Active: 0 Servers',
            type: ChannelType.GuildVoice,
            permissionOverwrites: permissions,
            parent: statistics
          });

          const statisticsOutage = await interaction.guild.channels.create({
            name: 'Outage: 0 Servers',
            type: ChannelType.GuildVoice,
            permissionOverwrites: permissions,
            parent: statistics
          });

          const management = await interaction.guild.channels.create({
            name: `AS:E Obelisk Management`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const managementStatus = await interaction.guild.channels.create({
            name: '⚫️│𝗦erver-𝗦tatus',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          await interaction.guild.channels.create({
            name: '⚫│𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          let embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Obelisk System Information**\nInformation is initialized in our database.\nProceeding with the setup process.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })

          const managementMessage = await managementStatus.send({ embeds: [embed] });

          const metadata = await interaction.guild.channels.create({
            name: `AS:E Player Metadata `,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const metadataPlayer = await interaction.guild.channels.create({
            name: '📄│𝗣layer-𝗠etadata',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: metadata
          });

          let button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Gamertag Search')
                .setCustomId('gamertag-search')
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),

              new ButtonBuilder()
                .setLabel('Username Search')
                .setCustomId('username-search')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false),
            );

          embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription('**Additional Information**\nYou do __not__ need to type their full tag or username. The bot will filter and return any matching values, case sensitivity does not matter.\n\n**Gamertag Searching**\nUsers will be collected and stored in our database whenever they join your cluster—allowing you to look up their gamertag to fetch information.\n\n**Username Searching**\nUsers will be collected and stored in our database whenever they cryopod a tame—allowing you to look up their in-game name to fetch information.')
            .setImage('https://i.imgur.com/2ZIHUgx.png');

          const metadataMessage = await metadataPlayer.send({ embeds: [embed], components: [button] })

          const audits = await interaction.guild.channels.create({
            name: `AS:E Audit Logging`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const auditsPlayer = await interaction.guild.channels.create({
            name: '📄│𝗣layer-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const auditsServer = await interaction.guild.channels.create({
            name: '📄│𝗦erver-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const logging = await interaction.guild.channels.create({
            name: `AS:E Game Logging `,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const loggingOnline = await interaction.guild.channels.create({
            name: '📑│𝗢nline-𝗟ogging',
            type: ChannelType.GuildForum,
            permissionOverwrites: permissions,
            parent: logging
          });

          const loggingAdmin = await interaction.guild.channels.create({
            name: '📑│𝗔dmin-𝗟ogging',
            type: ChannelType.GuildForum,
            permissionOverwrites: permissions,
            parent: logging
          });

          const loggingChat = await interaction.guild.channels.create({
            name: '📑│𝗖hat-𝗟ogging',
            type: ChannelType.GuildForum,
            permissionOverwrites: permissions,
            parent: logging
          });

          const loggingJoin = await interaction.guild.channels.create({
            name: '📑│𝗝oin-𝗟ogging',
            type: ChannelType.GuildForum,
            permissionOverwrites: permissions,
            parent: logging
          });

          button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Automatic Setup')
                .setCustomId('automatic-setup')
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),

              new ButtonBuilder()
                .setLabel('Manual Setup')
                .setCustomId('manual-setup')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            );

          embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Logging Creation Tooling**\nSelect the buttons below to utilize our logging services. Start with the automated setup, then begin installing the remaining manually.\n\n**Additional Information**\nActive servers generate faster-flowing logs. Nitrado may take upwards of one hour to process logs and submit them to your folder.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png')

          const process = await interaction.guild.channels.create({
            name: '📑│𝗜nstallation',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: logging
          });

          await process.send({ embeds: [embed], components: [button] });

          const protections = await interaction.guild.channels.create({
            name: `AS:E Protections `,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const protectionsDupe = await interaction.guild.channels.create({
            name: '🔗│𝗗upe-𝗗etection',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: protections
          });

          await db.collection('ase-configuration').doc(interaction.guild.id)
            .update({
              ['statistics']: { players: statisticsPlayers.id, active: statisticsActive.id, outage: statisticsOutage.id },
              ['status']: { channel: managementStatus.id, message: managementMessage.id },
              ['audits']: { server: auditsServer.id, player: auditsPlayer.id },

              ['forum']: { chat: loggingChat.id, join: loggingJoin.id, admin: loggingAdmin.id, online: loggingOnline.id },
              ['protections']: { channel: protectionsDupe.id }
            }, { merge: true });

          await installation.edit({ content: 'Installation complete...', ephemeral: true });
        };
      } catch (error) { console.log(error) };
    });
  },
};