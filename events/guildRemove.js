// events/guildRemove.js
const { removeGuildStorage } = require('../utils/storageManager');

module.exports = {
  name: 'guildRemove',
  async execute(guild) {
    removeGuildStorage(guild.id);
    console.log(`🗑️ Removed storage for server: ${guild.name} (${guild.id})`);
  }
};