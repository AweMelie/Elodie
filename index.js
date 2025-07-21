// index.js
require('dotenv').config();

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const loaders = require('./loaders');
const registerProcessHandlers = require('./utils/registerProcessHandlers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.commands = new Collection();

loaders(client);                   // wires commands, events, buttons, modals
registerProcessHandlers();         // your process.on('unhandledRejection') logic

console.log('🔄 Starting bot...');
client.login(process.env.TOKEN)
  .then(() => console.log('✅ Login successful'))
  .catch(err => console.error('❌ Login failed:', err));

  client.once('ready', () => {
  console.log(`✅ Elodie is online as ${client.user.tag}`);
});
