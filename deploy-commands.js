require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const TOKEN            = process.env.TOKEN;
const CLIENT_ID        = process.env.CLIENT_ID;
const SUPPORT_GUILD_ID = process.env.SUPPORT_GUILD_ID;
const OWNER_ID         = process.env.OWNER_ID;

const commandsDir    = path.join(__dirname, 'commands');
const globalCommands = [];
const guildCommands  = [];

// 1) Load global commands (all folders except supportGuild)
for (const folder of fs.readdirSync(commandsDir)) {
  if (folder === 'supportGuild') continue;
  const folderPath = path.join(commandsDir, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(folderPath, file));
    if (cmd.data && cmd.execute) {
      globalCommands.push(cmd.data.toJSON());
    }
  }
}

// 2) Load supportGuild commands
const supportPath = path.join(commandsDir, 'supportGuild');
for (const file of fs.readdirSync(supportPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(supportPath, file));
  if (cmd.data && cmd.execute) {
    guildCommands.push(cmd.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    // Deploy global commands
    if (globalCommands.length) {
      console.log('🔄 Refreshing global commands…');
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: globalCommands }
      );
      console.log('✅ Global commands registered');
    }

    // Deploy support-guild commands
    if (guildCommands.length) {
      console.log('🔄 Updating support-server commands…');
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, SUPPORT_GUILD_ID),
        { body: guildCommands }
      );
      console.log('✅ Support-server commands registered');
    }

  } catch (err) {
    console.error('❌ Error registering commands:', err);
  }
})();