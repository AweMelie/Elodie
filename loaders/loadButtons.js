// loaders/loadButtons.js
const { readdirSync } = require('fs');
const { join }        = require('path');

module.exports = client => {
  client.buttons = new Map();
  const dir = join(__dirname, '../interactions/buttons');
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const mod = require(join(dir, file));
    client.buttons.set(mod.customId, mod);
  }

  console.log(`✅ Loaded ${files.length} button handlers`);
};