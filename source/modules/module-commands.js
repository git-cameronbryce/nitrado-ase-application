const { Events } = require('discord.js');
const path = require('path');
const fs = require('fs');

const loadCommands = (client) => {
  const commandsPath = path.join(__dirname, '../command-handler');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  commandFiles.forEach(file => {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);
    await command.execute(interaction);
  });
};

module.exports = { loadCommands };