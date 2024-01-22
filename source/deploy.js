const { token, guild, client } = require('./other/config.json');
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const rest = new REST({ version: '10' }).setToken(token);

const deployment = async () => {
  const commandFiles = fs.readdirSync('source/command-handler')
    .filter(file => file.endsWith('.js'))
    .map(file => require(`./command-handler/${file}`))
    .map(command => command.data.toJSON());

  try {
    const data = await rest.put(
      Routes.applicationGuildCommands(client, guild),
      { body: commandFiles },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) { console.error(error) }
};

deployment()