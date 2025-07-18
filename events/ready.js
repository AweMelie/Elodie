const { ensureGuildStorage } = require('../utils/storageManager');
const fs = require('fs');
const path = require('path');
const { ActivityType } = require('discord.js');

const ACTIVITY_PATH = path.join(__dirname, '..', 'bot-storage', 'presence.json');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // ensure storage for each guild
    client.guilds.cache.forEach(guild =>
      ensureGuildStorage(guild.id)
    );

    // restore activity from bot-storage/presence.json
    if (fs.existsSync(ACTIVITY_PATH)) {
      try {
        const { type, text } = JSON.parse(fs.readFileSync(ACTIVITY_PATH));
        const mappedType = ActivityType[type];
        if (typeof mappedType === 'number' && text) {
          await client.user.setPresence({
            activities: [{ name: text, type: mappedType }],
            status: 'online'
          });
          console.log(`🔁 Restored presence: ${type} ${text}`);
        }
      } catch (err) {
        console.error('⚠️ Failed to restore presence:', err);
      }
    }
  }
};