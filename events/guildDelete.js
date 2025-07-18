// events/guildDelete.js
const { removeGuildStorage } = require('../utils/storageManager');

module.exports = {
  name: 'guildDelete',
  async execute(guild) {
    console.log('❌ guildDelete fired for', guild.id);
    removeGuildStorage(guild.id);
  }
};