// events/messageCreate.js
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const configPath = path.join(__dirname, '..', 'bot-storage', message.guild.id, 'config.json');
    const countPath  = path.join(__dirname, '..', 'bot-storage', message.guild.id, 'count.json');
    if (!fs.existsSync(configPath)) return;

    const config = JSON.parse(fs.readFileSync(configPath));
    const countChannelId = config.countChannel;
    if (!countChannelId || message.channel.id !== countChannelId) return;

    let countData = { lastNumber: 0, lastUserId: null };
    if (fs.existsSync(countPath)) {
      countData = JSON.parse(fs.readFileSync(countPath));
    }

    const content = message.content.trim();
    const number  = parseInt(content);
    if (isNaN(number) || number !== countData.lastNumber + 1) {
      await message.react('🥀');
      await message.channel.send(`🥀 <@${message.author.id}> counted incorrectly. The count has been reset.`);
      countData = { lastNumber: 0, lastUserId: null };
      fs.writeFileSync(countPath, JSON.stringify(countData, null, 2));
      return;
    }

    if (message.author.id === countData.lastUserId) {
      await message.react('🥀');
      await message.channel.send(`🥀 <@${message.author.id}> you can't count twice in a row!`);
      return;
    }

    countData.lastNumber = number;
    countData.lastUserId = message.author.id;
    fs.writeFileSync(countPath, JSON.stringify(countData, null, 2));
    await message.react('🌸');
  }
};