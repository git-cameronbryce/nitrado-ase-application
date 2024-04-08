const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { db } = require('../../script');
const axios = require('axios');
const { Unauthorized, PendingAuthorization } = require('../../utils/embeds');

const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      if (interaction.customId === 'automatic-setup') {
        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            return interaction.reply({ embeds: [Unauthorized(role)], ephemeral: true });
          };

          await interaction.deferReply();
          const gameserver = async (reference, services) => {
            let success = 0, total = 0;
            const path = async (reference, service, { game_specific: { path } }) => {
              const url = `https://api.nitrado.net/services/${service.id}/gameservers/file_server/download?file=${path}/ShooterGame/Saved/Logs/ShooterGame.log`;
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              if (response.status === 200) {
                success++
              };
            };

            const tasks = await services.map(async service => {
              const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              if (response.status === 200 && platforms[response.data.data.gameserver.game] && response.data.data.gameserver.query.server_name) {
                await path(reference, service, response.data.data.gameserver), total++;
              };
            });

            await Promise.all(tasks).then(async () => {
              const button = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setLabel('Confirm Setup')
                    .setCustomId('confirm-setup')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(false),

                  new ButtonBuilder()
                    .setLabel('Cancel Setup')
                    .setCustomId('cancel-setup')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false),
                );
              await interaction.followUp({ embeds: [PendingAuthorization(success,total)], components: [button], ephemeral: false });
            });
          };

          const service = async (reference) => {
            try {
              const url = 'https://api.nitrado.net/services';
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              response.status === 200 ? gameserver(reference, response.data.data.services) : unauthorized();
            } catch (error) { console.log(error) };
          };

          const token = async (reference) => {
            try {
              const url = 'https://oauth.nitrado.net/token';
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              response.status === 200 ? service(reference) : unauthorized();
            } catch (error) { console.log(error) };
          };

          const reference = (await db.collection('ase-configuration').doc(interaction.guild.id).get()).data();
          reference ? await token(reference) : unauthorized();
        })
      };

      if (interaction.customId === 'confirm-setup') {
        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            return interaction.reply({ embeds: [Unauthorized(role)], ephemeral: true });
          };

          await interaction.deferReply();
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Thread Command Success**\nInformation is initialized in our database.\nProceeding with the setup process.\n\n**Additional Information**\nLogging is in a beta state, be patient. \nMay take upwards of five minutes.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })

          await interaction.followUp({ embeds: [embed] });

          try {
            const message = await interaction.message;

            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Confirm Setup')
                  .setCustomId('confirm-setup')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true),

                new ButtonBuilder()
                  .setLabel('Cancel Setup')
                  .setCustomId('cancel-setup')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nThe bot will begin installing your logging.\n\`🔐\` \`Command Executed: Locked\`\n\n**Additional Information**\nMultiple threads will be generated.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            await message.edit({ embeds: [embed], components: [button], ephemeral: false })
          } catch (error) { console.log(error) };

          const gameserver = async (reference, services) => {
            const generate = async (reference, service, query) => {
              const onlineForum = await interaction.client.channels.fetch(reference.forum.online);
              const adminForum = await interaction.client.channels.fetch(reference.forum.admin);
              const chatForum = await interaction.client.channels.fetch(reference.forum.chat);
              const joinForum = await interaction.client.channels.fetch(reference.forum.join);

              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setDescription(`**Obelisk System Information**\nInformation is initialized in our database.\nProceeding with the setup process.\n\n**Collected Information**\nServer Identification: \`${service.id}\``)
                .setFooter({ text: 'Tip: Contact support if there are issues.' })

              const onlineThread = await onlineForum.threads.create({
                name: `${query.server_name} - ${service.id}`,
                type: ChannelType.PrivateThread,
                message: { embeds: [embed] }
              });

              const adminThread = await adminForum.threads.create({
                name: `${query.server_name} - ${service.id}`,
                type: ChannelType.PrivateThread,
                message: { embeds: [embed] }
              });

              const chatThread = await chatForum.threads.create({
                name: `${query.server_name} - ${service.id}`,
                type: ChannelType.PrivateThread,
                message: { embeds: [embed] }
              });

              const joinThread = await joinForum.threads.create({
                name: `${query.server_name} - ${service.id}`,
                type: ChannelType.PrivateThread,
                message: { embeds: [embed] }
              });

              const data = {
                'online': { [service.id]: { thread: onlineThread.id, message: onlineThread.lastMessageId } },
                'admin': { [service.id]: adminThread.id },
                'chat': { [service.id]: chatThread.id },
                'join': { [service.id]: joinThread.id }
              };

              //! One database write per server owned: ~ Put safeguard. 
              await db.collection('ase-configuration').doc(interaction.guild.id).set(data, { merge: true })
                .then(() => { console.log('Database Finished:') });
            };

            const path = async (reference, service, { query, game_specific: { path } }) => {
              const url = `https://api.nitrado.net/services/${service.id}/gameservers/file_server/download?file=${path}/ShooterGame/Saved/Logs/ShooterGame.log`;
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              if (response.status === 200) {
                await generate(reference, service, query);
              };
            };

            const tasks = await services.map(async service => {
              const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
              const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
              if (response.status === 200 && platforms[response.data.data.gameserver.game] && response.data.data.gameserver.query.server_name) {
                await path(reference, service, response.data.data.gameserver);
              };
            });

            await Promise.all(tasks).then(async () => {
              console.log('Command Finished:')
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

          const reference = (await db.collection('ase-configuration').doc(interaction.guild.id).get()).data();
          reference ? await token(reference) : unauthorized();
        })
      };

      if (interaction.customId === 'cancel-setup') {
        await interaction.reply({ content: 'Just delete the embed, for now!' })
      }
    });
  },
};