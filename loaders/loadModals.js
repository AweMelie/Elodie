// loaders/loadModals.js
const { readdirSync } = require('fs');
const { join }        = require('path');

module.exports = client => {
  client.modals = new Map();
  const dir = join(__dirname, '../interactions/modals');
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const mod = require(join(dir, file));
    client.modals.set(mod.customId, mod);
  }

  console.log(`✅ Loaded ${files.length} modal handlers`);
};