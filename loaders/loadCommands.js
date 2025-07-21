// loaders/loadCommands.js
const { readdirSync } = require('fs');
const { join }        = require('path');

module.exports = client => {
  const commandsPath = join(__dirname, '../commands');
  const folders = readdirSync(commandsPath);

  for (const folder of folders) {
    const files = readdirSync(join(commandsPath, folder))
      .filter(f => f.endsWith('.js'));

    for (const file of files) {
      const filePath = join(commandsPath, folder, file);
      console.log('🧠 Trying to load:', filePath);
      const cmd = require(filePath);

      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
      } else {
        console.warn(`[WARN] commands/${folder}/${file} is missing data or execute.`);
      }
    }
  }

  console.log(`✅ Loaded ${client.commands.size} commands`);
};