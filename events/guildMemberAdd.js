// events/guildMemberAdd.js
const { EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../utils/storageManager');
const formatPlaceholders = require('../utils/formatPlaceholders');
const convertColor       = require('../utils/convertColor');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildId = member.guild.id;
    ensureGuildStorage(guildId);

    // ─── Load configs ──────────────────────────────────────────
    const eventsConfig = loadConfig(guildId, 'server-events.json') || {};
    const mainConfig   = loadConfig(guildId, 'config.json')      || {};
    const savedEmbeds  = loadConfig(guildId, 'embeds.json')      || {};

    // ─── 1) Welcome message ──────────────────────────────────
    const welcomeChannelId = eventsConfig.welcomeChannel;
    const welcomeMessage   = eventsConfig.welcomeMessage;
    if (welcomeChannelId && welcomeMessage) {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (channel) {
        // Extract embed reference
        const embedMatch = welcomeMessage.match(/\{embed:([\w-]+)\}/);
        const embedName  = embedMatch?.[1];
        const rawText    = welcomeMessage.replace(/\{embed:[\w-]+\}/, '').trim();
        const text       = formatPlaceholders(member, member.guild, rawText);

        let welcomeEmbed = null;
        if (embedName && savedEmbeds[embedName]) {
          const raw     = savedEmbeds[embedName];
          const base    = {
            title:       null,
            description: null,
            color:       '#00FFFF',
            author:      { name: null,   icon_url: null },
            footer:      { text: null,   icon_url: null },
            thumbnail:   { url:  null },
            image:       { url:  null },
            fields:      [],
            timestamp:   false
          };
          // Merge raw into defaults
          const cfg = {
            ...base,
            ...raw,
            author:    { ...base.author,    ...raw.author    },
            footer:    { ...base.footer,    ...raw.footer    },
            thumbnail: { ...base.thumbnail, ...raw.thumbnail },
            image:     { ...base.image,     ...raw.image     },
            fields:    Array.isArray(raw.fields) ? raw.fields : base.fields
          };

          // Build embed with placeholders
          const eb = new EmbedBuilder();
          const safeColor = convertColor(cfg.color || base.color);
          if (safeColor !== null) eb.setColor(safeColor);

          if (cfg.title) {
            eb.setTitle(formatPlaceholders(member, member.guild, cfg.title));
          }
          if (cfg.description) {
            eb.setDescription(formatPlaceholders(member, member.guild, cfg.description));
          }
          if (cfg.fields.length) {
            eb.setFields(
              cfg.fields.map(f => ({
                name:  formatPlaceholders(member, member.guild, f.name),
                value: formatPlaceholders(member, member.guild, f.value),
                inline: !!f.inline
              }))
            );
          }
          if (cfg.author.name) {
            eb.setAuthor({
              name:    formatPlaceholders(member, member.guild, cfg.author.name),
              iconURL: cfg.author.icon_url
            });
          }
          if (cfg.footer.text) {
            eb.setFooter({
              text:    formatPlaceholders(member, member.guild, cfg.footer.text),
              iconURL: cfg.footer.icon_url
            });
          }
          if (cfg.thumbnail.url) eb.setThumbnail(cfg.thumbnail.url);
          if (cfg.image.url)     eb.setImage(cfg.image.url);
          if (cfg.timestamp)     eb.setTimestamp();

          welcomeEmbed = eb;
        }

        await channel.send({
          content: text,
          embeds:  welcomeEmbed ? [welcomeEmbed] : []
        });
      }
    }

    // ─── 2) Moderation log ─────────────────────────────────
    const logChannelId = mainConfig.logChannel;
    if (logChannelId) {
      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const joinEmbed = new EmbedBuilder()
          .setTitle('Member Joined')
          .setColor(0x00FF00)
          .setTimestamp()
          .addFields(
            {
              name:   'Username',
              value:  member.user.tag,
              inline: true
            },
            {
              name:   'User ID',
              value:  `\`${member.id}\``,
              inline: true
            },
            {
              name:   'Display Name',
              value:  member.displayName,
              inline: true
            },
            {
              name:   'Account Created',
              value:  `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
              inline: true
            },
            {
              name:   'Joined Server',
              value:  `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
              inline: true
            }
          )
          .setFooter({ text: 'User joined' });

        await logChannel.send({ embeds: [joinEmbed] });
      }
    }
  }
};