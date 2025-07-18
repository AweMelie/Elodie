const { ensureGuildStorage } = require('../utils/storageManager');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    ensureGuildStorage(guild.id);
    console.log(`📁 Storage initialized for server: ${guild.name} (${guild.id})`);
  }
};