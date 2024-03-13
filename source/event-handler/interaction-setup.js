const { ActionRowBuilder, Events, ModalBuilder, ChannelType, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { db } = require('../script.js');
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
                  .setLabel('Base Version')
                  .setCustomId('base-version')
                  .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                  .setLabel('Upgraded Version')
                  .setCustomId('upgraded-version')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Token Creation & Overview**\n For those interested in upgrading to our more advanced tooling, the payment __must__ be done before installation, the base version is free.\n\n**Additional Information**\nSelect the upgrade button below for those who want our premium version. After the payment, press it again for a seamless transition.\n\n__Premium temporarily disabled.__ \n\n**[Partnership & Information](https://nitra.do/obeliskdevelopment "Nitrado Partner Link")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
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
            response.status === 200 && interaction.guild.features.includes('COMMUNITY')
              ? validToken(nitrado) : invalidToken();

          } catch (error) { invalidToken(), null; }
        };

        if (interaction.customId === 'base-version') {
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

          const players = await interaction.guild.channels.create({
            name: 'Active: 0 Players',
            type: ChannelType.GuildVoice,
            permissionOverwrites: permissions,
            parent: statistics
          });

          const active = await interaction.guild.channels.create({
            name: 'Active: 0 Servers',
            type: ChannelType.GuildVoice,
            permissionOverwrites: permissions,
            parent: statistics
          });

          const outage = await interaction.guild.channels.create({
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

          await interaction.guild.channels.create({
            name: '⚫│𝗕ot-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          const status = await interaction.guild.channels.create({
            name: '⚫│𝗦erver-𝗦tatus',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          let embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Cluster Status Installation**\nThe status page is currently being installed. \nBelow is the expected processing timer. \n\nEstimated: <t:${Math.floor(Date.now() / 1000) + 300}:R>`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png')

          const message = await status.send({ embeds: [embed] });

          const audits = await interaction.guild.channels.create({
            name: `AS:E Audit Logging`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const playerCommands = await interaction.guild.channels.create({
            name: '📄│𝗣layer-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const serverCommands = await interaction.guild.channels.create({
            name: '📄│𝗦erver-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const loggingProcess = await interaction.guild.channels.create({
            name: '📄│𝗟ogging-𝗣rocess',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setURL('https://discord.gg/jee3ukfvVr')
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link),
            );

          embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Logging Setup & Overview**\nFor those interested in utilizing our logging features, add our dedicated application which is compatible with both \`AS: E / A\` game versions.\n\n**Logging Expected Release **\nConsider joining our community below, where you can follow expected release schedules.  We are working with another developer for this project.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png')

          await loggingProcess.send({ embeds: [embed], components: [button] });

          const protections = await interaction.guild.channels.create({
            name: `AS:E Protections `,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const dupe = await interaction.guild.channels.create({
            name: '🔗│𝗗upe-𝗗etection',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: protections
          });

          await db.collection('ase-configuration').doc(interaction.guild.id)
            .set({
              ['protections']: { channel: dupe.id },
              ['statistics']: { players: players.id, active: active.id, outage: outage.id },
              ['audits']: { server: serverCommands.id, player: playerCommands.id },
              ['status']: { channel: status.id, message: message.id },
            }, { merge: true });

          await installation.edit({ content: 'Installation complete...', ephemeral: true });
        };
      } catch (error) { console.log(error) };
    });
  },
};