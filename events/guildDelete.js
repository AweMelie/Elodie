// events/guildDelete.js
const { removeGuildStorage } = require('../utils/storageManager');

module.exports = {
  name: 'guildDelete',      // <-- must match Discord.js event
  async execute(guild) {
    removeGuildStorage(guild.id);
    console.log(`🗑️ Removed storage for server: ${guild.name} (${guild.id})`);
  }
};