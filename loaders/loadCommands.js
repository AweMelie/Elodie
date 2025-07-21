// loaders/loadCommands.js
console.log('🔎 Running loadCommands from:', __dirname);
console.log('🗂️  CWD during load:', process.cwd());

const { readdirSync } = require('fs');
const { join }        = require('path');

module.exports = client => {
  const commandsPath = join(__dirname, '../commands');
  const folders = readdirSync(commandsPath);

  console.log('🔍 Loading commands from:', commandsPath);
  console.log('📁 Command folders found:', folders);

  for (const folder of folders) {
    const folderPath = join(commandsPath, folder);
    const files = readdirSync(folderPath).filter(f => f.endsWith('.js'));

    console.log(`📂 Scanning folder: ${folder}`);
    console.log('📄 Files in folder:', files);

    for (const file of files) {
      const filePath = join(folderPath, file);
      console.log('🧠 Trying to load:', filePath);

      try {
        const cmd = require(filePath);
        console.log(`🔬 Loaded cmd from ${file}:`, cmd);

        if (cmd.data && cmd.execute) {
          client.commands.set(cmd.data.name, cmd);
        } else {
          console.warn(`[WARN] commands/${folder}/${file} is missing data or execute.`);
        }
      } catch (err) {
        console.error(`❌ Error loading command ${file}:`, err.message);
      }
    }
  }

  console.log(`✅ Loaded ${client.commands.size} commands`);
};
