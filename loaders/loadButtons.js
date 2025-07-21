const { readdirSync } = require('fs');
const { join }        = require('path');

module.exports = client => {
  client.buttons = new Map();
  const dir = join(__dirname, '../interactions/buttons');
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = join(dir, file);
    const mod = require(filePath);

    if (mod.customId && mod.execute) {
      client.buttons.set(mod.customId, mod);
    } else {
      console.warn(`[WARN] button ${file} is missing customId or execute.`);
    }
  }

  console.log(`✅ Loaded ${client.buttons.size} button handlers`);
};
