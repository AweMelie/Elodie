// events/guildMemberUpdate.js
const { EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../utils/storageManager');
const formatPlaceholders = require('../utils/formatPlaceholders');
const convertColor       = require('../utils/convertColor');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    // only handle new boosts
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const guildId = newMember.guild.id;
      ensureGuildStorage(guildId);

      // load your event/channel config and saved embeds
      const eventsConfig = loadConfig(guildId, 'server-events.json') || {};
      const savedEmbeds  = loadConfig(guildId, 'embeds.json')        || {};

      const boostChannelId  = eventsConfig.boostChannel;
      const boostMessageTpl = eventsConfig.boostMessage;
      if (!boostChannelId || !boostMessageTpl) return;

      const channel = newMember.guild.channels.cache.get(boostChannelId);
      if (!channel) return;

      // extract any {embed:name} from your message template
      const embedMatch = boostMessageTpl.match(/\{embed:([\w-]+)\}/);
      const embedName  = embedMatch?.[1];
      const rawText    = boostMessageTpl.replace(/\{embed:[\w-]+\}/, '').trim();
      const content    = formatPlaceholders(newMember, newMember.guild, rawText);

      // build the optional embed, merging defaults + running placeholders
      let boostEmbed = null;
      if (embedName && savedEmbeds[embedName]) {
        const raw  = savedEmbeds[embedName];
        const base = {
          title:       null,
          description: null,
          color:       '#5865F2',
          author:      { name: null,   icon_url: null },
          footer:      { text: null,   icon_url: null },
          thumbnail:   { url:  null },
          image:       { url:  null },
          fields:      [],
          timestamp:   false
        };

        // merge raw into the default skeleton
        const cfg = {
          ...base,
          ...raw,
          author:    { ...base.author,    ...raw.author    },
          footer:    { ...base.footer,    ...raw.footer    },
          thumbnail: { ...base.thumbnail, ...raw.thumbnail },
          image:     { ...base.image,     ...raw.image     },
          fields:    Array.isArray(raw.fields) ? raw.fields : base.fields
        };

        const eb = new EmbedBuilder();
        const safeColor = convertColor(cfg.color || base.color);
        if (safeColor !== null) eb.setColor(safeColor);

        if (cfg.title) {
          eb.setTitle(formatPlaceholders(newMember, newMember.guild, cfg.title));
        }
        if (cfg.description) {
          eb.setDescription(formatPlaceholders(newMember, newMember.guild, cfg.description));
        }
        if (cfg.fields.length) {
          eb.setFields(
            cfg.fields.map(f => ({
              name:  formatPlaceholders(newMember, newMember.guild, f.name),
              value: formatPlaceholders(newMember, newMember.guild, f.value),
              inline: !!f.inline
            }))
          );
        }
        if (cfg.author.name) {
          eb.setAuthor({
            name:    formatPlaceholders(newMember, newMember.guild, cfg.author.name),
            iconURL: cfg.author.icon_url
          });
        }
        if (cfg.footer.text) {
          eb.setFooter({
            text:    formatPlaceholders(newMember, newMember.guild, cfg.footer.text),
            iconURL: cfg.footer.icon_url
          });
        }
        if (cfg.thumbnail.url) eb.setThumbnail(cfg.thumbnail.url);
        if (cfg.image.url)     eb.setImage(cfg.image.url);
        if (cfg.timestamp)     eb.setTimestamp();

        boostEmbed = eb;
      }

      // send the boost announcement
      await channel.send({
        content,
        embeds:  boostEmbed ? [boostEmbed] : []
      });
    }
  }
};