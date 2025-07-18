// events/guildMemberUpdate.js
const { EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../utils/storageManager');
const formatPlaceholders = require('../utils/formatPlaceholders');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    // detect new boost
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const guildId = newMember.guild.id;

      // ensure storage and load event & embed configs
      ensureGuildStorage(guildId);
      const eventsConfig = loadConfig(guildId, 'server-events.json');
      const savedEmbeds  = loadConfig(guildId, 'embeds.json');

      const boostChannelId  = eventsConfig.boostChannel;
      const boostMessageTpl = eventsConfig.boostMessage;
      if (!boostChannelId || !boostMessageTpl) return;

      const channel = newMember.guild.channels.cache.get(boostChannelId);
      if (!channel) return;

      // parse out embed placeholder
      const embedMatch = boostMessageTpl.match(/\{embed:([\w-]+)\}/);
      const embedName  = embedMatch?.[1];
      const rawText    = boostMessageTpl.replace(/\{embed:[\w-]+\}/, '').trim();
      const content    = formatPlaceholders(newMember, newMember.guild, rawText);

      // build optional embed
      let boostEmbed = null;
      if (embedName && savedEmbeds[embedName]) {
        boostEmbed = EmbedBuilder.from(savedEmbeds[embedName]);
      }

      // send boost announcement
      await channel.send({
        content,
        embeds: boostEmbed ? [boostEmbed] : []
      });
    }
  }
};