// events/guildCreate.js
const { ensureGuildStorage } = require('../utils/storageManager');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    console.log('➡️ guildCreate fired for', guild.id);
    ensureGuildStorage(guild.id);
  }
};