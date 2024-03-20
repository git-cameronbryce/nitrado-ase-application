const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

const platforms = { arkxb: true, arkps: true, arkse: true, arkswitch: true };

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      if (interaction.customId === 'automatic-setup') {
        await interaction.deferReply();

        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            return interaction.reply({ embeds: [embed], ephemeral: true });
          };

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
              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nThe bot will begin installing your logging.\n\`🔐\` Pending: x${success} \`🟠\` Failure: x${total - success}\n\n**Additional Information**\nMultiple threads will be generated.`)
                .setFooter({ text: 'Tip: Contact support if there are issues.' })

              await interaction.followUp({ embeds: [embed], components: [button], ephemeral: false });
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

      if (interaction.customId === 'confirm-setup') {
        await interaction.deferReply();

        await interaction.guild.roles.fetch().then(async roles => {
          const role = roles.find(role => role.name === 'Obelisk Permission');

          if (!role || !interaction.member.roles.cache.has(role.id)) {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })

            return interaction.reply({ embeds: [embed], ephemeral: true });
          };

          const gameserver = async (reference, services) => {
            const generate = async (reference, service, query) => {
              const adminForum = await interaction.client.channels.fetch(reference.forum.admin);
              const chatForum = await interaction.client.channels.fetch(reference.forum.chat);

              const adminThread = await adminForum.threads.create({
                name: `${query.server_name} - ${service.id}`,
                type: ChannelType.PrivateThread,
                message: { content: '...' }
              });

              const chatThread = await chatForum.threads.create({
                name: `${query.server_name} - ${service.id}`,
                type: ChannelType.PrivateThread,
                message: { content: '...' }
              });

              const data = {
                'admin': { [adminThread.id]: adminThread.id },
                'chat': { [chatThread.id]: chatThread.id }
              };

              //! One database write per server owned: ~ Put safeguard. 
              await db.collection('configuration').doc(interaction.guild.id).set(data, { merge: true })
                .then(() => { console.log('Database Finished:') });
            }
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
    });
  },
};