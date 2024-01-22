const fs = require('fs');
const path = require('path');

const loadEvents = (client) => {
  const eventsPath = path.join(__dirname, '../event-handler');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  eventFiles.forEach(file => {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    event.once
      ? client.once(event.name, (...args) => event.execute(...args))
      : client.on(event.name, (...args) => event.execute(...args));
  });
};

module.exports = { loadEvents };