// utils/storageManager.js
const fs   = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'bot-storage');

/**
 * Make sure the base storage folder exists.
 */
function ensureBaseDir() {
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
    console.log(`🗂 Created base storage dir at ${BASE_DIR}`);
  }
}

/**
 * Ensure a guild’s storage folder + default files exist.
 */
function ensureGuildStorage(guildId) {
  ensureBaseDir();

  const guildDir = path.join(BASE_DIR, guildId);
  if (!fs.existsSync(guildDir)) {
    fs.mkdirSync(guildDir, { recursive: true });
    console.log(`🗂 Created storage folder for guild: ${guildId}`);
  }

  const files = ['config.json', 'server-events.json', 'embeds.json'];
  for (const file of files) {
    const fp = path.join(guildDir, file);
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, JSON.stringify({}, null, 2), 'utf-8');
      console.log(`📝 Created default ${file} for guild: ${guildId}`);
    }
  }
}

/**
 * Load & parse a guild-specific JSON file.
 */
function loadConfig(guildId, fileName) {
  const filePath = path.join(BASE_DIR, guildId, fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Atomically write a guild-specific JSON file.
 */
function saveConfig(guildId, fileName, data) {
  const filePath = path.join(BASE_DIR, guildId, fileName);
  const tmpPath  = filePath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

/**
 * Remove an entire guild’s storage folder.
 */
function removeGuildStorage(guildId) {
  const guildDir = path.join(BASE_DIR, guildId);
  if (fs.existsSync(guildDir)) {
    // Requires Node.js v14.14+; for older Node, swap with fs.rmdirSync
    fs.rmSync(guildDir, { recursive: true, force: true });
    console.log(`🗑️ Removed storage for guild: ${guildId}`);
  } else {
    console.log(`⚠️ No storage found to remove for guild: ${guildId}`);
  }
}

module.exports = {
  ensureGuildStorage,
  loadConfig,
  saveConfig,
  removeGuildStorage
};