// events/guildMemberAdd.js
const { EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../utils/storageManager');
const formatPlaceholders = require('../utils/formatPlaceholders');
const convertColor       = require('../utils/convertColor'); // ⬅️ NEW

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildId = member.guild.id;

    // 1️⃣ Ensure storage & load configs
    ensureGuildStorage(guildId);
    const eventsConfig = loadConfig(guildId, 'server-events.json');
    const mainConfig   = loadConfig(guildId, 'config.json');
    const savedEmbeds  = loadConfig(guildId, 'embeds.json');

    // 2️⃣ Send welcome message if set
    const welcomeChannelId = eventsConfig.welcomeChannel;
    const welcomeMessage   = eventsConfig.welcomeMessage;
    if (welcomeChannelId && welcomeMessage) {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (channel) {
        // Parse out any embed placeholder
        const embedMatch = welcomeMessage.match(/\{embed:([\w-]+)\}/);
        const embedName  = embedMatch?.[1];
        const rawText    = welcomeMessage.replace(/\{embed:[\w-]+\}/, '').trim();
        const text       = formatPlaceholders(member, member.guild, rawText);

        let welcomeEmbed = null;
        if (embedName && savedEmbeds[embedName]) {
          const rawEmbed = savedEmbeds[embedName];
          const embed    = EmbedBuilder.from(rawEmbed);

          // convert hex color to int if needed
          const safeColor = convertColor(rawEmbed.color);
          if (safeColor !== null) {
            embed.setColor(safeColor);
          }

          welcomeEmbed = embed;
        }

        await channel.send({
          content: text,
          embeds:  welcomeEmbed ? [welcomeEmbed] : []
        });
      }
    }

    // 3️⃣ Log join to moderation channel if configured
    const logChannelId = mainConfig.logChannel;
    if (logChannelId) {
      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const joinEmbed = new EmbedBuilder()
          .setTitle('Member Joined')
          .setColor(0x00ff00)
          .setTimestamp()
          .addFields(
            {
              name:   'Username',
              value:  `${member.user.tag}`,
              inline: true
            },
            {
              name:   'User ID',
              value:  `\`${member.id}\``,
              inline: true
            },
            {
              name:   'Display Name',
              value:  `${member.displayName}`,
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