const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { loadCommands } = require('./modules/module-commands');
const { loadEvents } = require('./modules/module-events');
const { token } = require('./other/config.json');

const serviceAccount = require('./other/firebase.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
module.exports = { db };

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();

loadCommands(client), loadEvents(client)

client.on('ready', () => {
  client.user.setActivity('/ commands',
    { type: ActivityType.Listening });
});



client.login(token).then(() => console.log('Client logged in...'));