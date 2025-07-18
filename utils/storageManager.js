// utils/storageManager.js
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'bot-storage');

function ensureGuildStorage(guildId) {
  const dir = path.join(BASE_DIR, guildId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`🗂 Created storage folder for guild: ${guildId}`);
  }

  // Ensure these three files exist, with empty object defaults
  const files = ['config.json', 'server-events.json', 'embeds.json'];
  for (const file of files) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, JSON.stringify({}, null, 2), 'utf-8');
      console.log(`📝 Created default ${file} for guild: ${guildId}`);
    }
  }
}

function loadConfig(guildId, fileName) {
  const filePath = path.join(BASE_DIR, guildId, fileName);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // Missing file or invalid JSON → return empty object
    return {};
  }
}

function saveConfig(guildId, fileName, data) {
  const filePath = path.join(BASE_DIR, guildId, fileName);
  const tmpPath  = filePath + '.tmp';

  // Atomic write: dump to .tmp then rename
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

module.exports = {
  ensureGuildStorage,
  loadConfig,
  saveConfig
};