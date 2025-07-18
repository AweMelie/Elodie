// events/guildMemberRemove.js
const { EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../utils/storageManager');
const formatPlaceholders = require('../utils/formatPlaceholders');
const convertColor       = require('../utils/convertColor');

function formatDuration(ms) {
  const sec  = Math.floor(ms / 1000);
  const min  = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr   = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const guildId = member.guild.id;
    ensureGuildStorage(guildId);

    // Load configs
    const eventsConfig = loadConfig(guildId, 'server-events.json') || {};
    const mainConfig   = loadConfig(guildId, 'config.json')      || {};
    const savedEmbeds  = loadConfig(guildId, 'embeds.json')      || {};

    // ─── 1) Leave message ─────────────────────────────────────
    const leaveChannelId  = eventsConfig.leaveChannel;
    const leaveMessageTpl = eventsConfig.leaveMessage;
    if (leaveChannelId && leaveMessageTpl) {
      const leaveChannel = member.guild.channels.cache.get(leaveChannelId);
      if (leaveChannel) {
        // Extract embed reference
        const embedMatch = leaveMessageTpl.match(/\{embed:([\w-]+)\}/);
        const embedName  = embedMatch?.[1];
        const rawText    = leaveMessageTpl.replace(/\{embed:[\w-]+\}/, '').trim();
        const text       = formatPlaceholders(member, member.guild, rawText);

        let leaveEmbed = null;
        if (embedName && savedEmbeds[embedName]) {
          const raw   = savedEmbeds[embedName];
          const base  = {
            title:       null,
            description: null,
            color:       '#FF5555',
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

          leaveEmbed = eb;
        }

        await leaveChannel.send({
          content: text,
          embeds:  leaveEmbed ? [leaveEmbed] : []
        });
      }
    }

    // ─── 2) Log departure ─────────────────────────────────────
    const logChannelId = mainConfig.logChannel;
    if (logChannelId) {
      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const joinedAt  = member.joinedTimestamp;
        const duration  = Date.now() - joinedAt;
        const stayedFor = formatDuration(duration);

        const roles = member.roles.cache
          .filter(r => r.id !== member.guild.id)
          .map(r => r.name)
          .join(', ') || 'None';

        const leaveLog = new EmbedBuilder()
          .setTitle('Member Left')
          .setColor(0xFF9900)
          .setTimestamp()
          .addFields(
            { name: 'User',           value: member.user.tag, inline: true },
            { name: 'User ID',        value: `\`${member.id}\``, inline: true },
            { name: 'Display Name',   value: member.displayName, inline: true },
            { name: 'Time on Server', value: stayedFor,           inline: true },
            { name: 'Roles Held',     value: roles,               inline: false }
          );

        await logChannel.send({ embeds: [leaveLog] });
      }
    }
  }
};