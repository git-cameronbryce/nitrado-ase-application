const fs = require('fs');
const path = require('path');

const loadEvents = (client, folderPath = '../event-handler') => {
  const eventsPath = path.join(__dirname, folderPath);
  const files = fs.readdirSync(eventsPath);

  files.forEach(file => {
    const filePath = path.join(eventsPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, recursively load events from it
      loadEvents(client, path.join(folderPath, file));
    } else if (file.endsWith('.js')) {
      // If it's a .js file, require and register the event
      const event = require(filePath);

      event.once
        ? client.once(event.name, (...args) => event.execute(...args))
        : client.on(event.name, (...args) => event.execute(...args));
    }
  });
};

module.exports = { loadEvents };
