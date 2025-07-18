// loaders/loadEvents.js
const { readdirSync } = require('fs');
const { join }        = require('path');

module.exports = client => {
  const eventsPath = join(__dirname, '../events');
  const files = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const evt = require(join(eventsPath, file));
    if (evt.once) {
      client.once(evt.name, (...args) => evt.execute(...args, client));
    } else {
      client.on(evt.name, (...args) => evt.execute(...args, client));
    }
  }

  console.log(`✅ Loaded ${files.length} events`);
};