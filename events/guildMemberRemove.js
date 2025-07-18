// events/guildMemberRemove.js
const { EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../utils/storageManager');
const formatPlaceholders = require('../utils/formatPlaceholders');

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
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

    // Load guild storage and configs
    ensureGuildStorage(guildId);
    const eventsConfig = loadConfig(guildId, 'server-events.json');
    const mainConfig   = loadConfig(guildId, 'config.json');
    const savedEmbeds  = loadConfig(guildId, 'embeds.json');

    // 1️⃣ Send custom leave message if configured
    const leaveChannelId  = eventsConfig.leaveChannel;
    const leaveMessageTpl = eventsConfig.leaveMessage;
    if (leaveChannelId && leaveMessageTpl) {
      const leaveChannel = member.guild.channels.cache.get(leaveChannelId);
      if (leaveChannel) {
        const embedMatch = leaveMessageTpl.match(/\{embed:([\w-]+)\}/);
        const embedName  = embedMatch?.[1];
        const rawText    = leaveMessageTpl.replace(/\{embed:[\w-]+\}/, '').trim();
        const text       = formatPlaceholders(member, member.guild, rawText);

        let leaveEmbed = null;
        if (embedName && savedEmbeds[embedName]) {
          leaveEmbed = EmbedBuilder.from(savedEmbeds[embedName]);
        }

        await leaveChannel.send({
          content: text,
          embeds: leaveEmbed ? [leaveEmbed] : []
        });
      }
    }

    // 2️⃣ Log departure in moderation channel
    const logChannelId = mainConfig.logChannel;
    if (!logChannelId) return;

    const logChannel = member.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const joinedAt   = member.joinedTimestamp;
    const duration   = Date.now() - joinedAt;
    const stayedFor  = formatDuration(duration);

    const roles = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => r.name)
      .join(', ') || 'None';

    const leaveLog = new EmbedBuilder()
      .setTitle('Member Left')
      .setColor(0xff9900)
      .addFields(
        { name: 'User',         value: member.user.tag,       inline: true },
        { name: 'User ID',      value: `\`${member.id}\``,     inline: true },
        { name: 'Display Name', value: member.displayName,     inline: true },
        { name: 'Time on Server', value: stayedFor,           inline: true },
        { name: 'Roles Held',   value: roles,                  inline: false }
      );

    await logChannel.send({ embeds: [leaveLog] });
  }
};