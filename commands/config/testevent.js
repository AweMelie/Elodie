// commands/testevent.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../../utils/storageManager');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const convertColor       = require('../../utils/convertColor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testevent')
    .setDescription('Preview a configured server message: welcome, leave, boost, or verify.')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Which message type to preview')
        .setRequired(true)
        .addChoices(
          { name: 'Welcome', value: 'welcome' },
          { name: 'Leave',   value: 'leave' },
          { name: 'Boost',   value: 'boost' },
          { name: 'Verify',  value: 'verify' }
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const member  = interaction.member;
    const type    = interaction.options.getString('type');

    // 1️⃣ Ensure storage & load configs
    ensureGuildStorage(guildId);
    const events      = loadConfig(guildId, 'server-events.json') || {};
    const savedEmbeds = loadConfig(guildId, 'embeds.json')        || {};

    // 2️⃣ Verify channel & message template exist
    const channelId       = events[`${type}Channel`];
    const messageTemplate = events[`${type}Message`];
    const missing = [];
    if (!channelId)       missing.push('channel');
    if (!messageTemplate) missing.push('message');
    if (missing.length) {
      return interaction.reply({
        content: `Missing ${missing.join(' & ')} for **${type}** event. Use \`/${type}channel\` and \`/${type}message\`.`,
        flags: 64
      });
    }

    // 3️⃣ Resolve target channel
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({
        content: `Channel set for **${type}** event no longer exists.`,
        flags: 64
      });
    }

    // 4️⃣ Extract embed reference & format plain text
    const embedMatch  = messageTemplate.match(/\{embed:([\w-]+)\}/);
    const embedName   = embedMatch?.[1];
    const rawMessage  = messageTemplate.replace(/\{embed:[\w-]+\}/, '').trim();
    const formattedText = formatPlaceholders(member, interaction.guild, rawMessage);

    // 5️⃣ If an embed is referenced, rebuild it with placeholder formatting
    let formattedEmbed = null;
    if (embedName && savedEmbeds[embedName]) {
      const raw     = savedEmbeds[embedName];
      const defaultCfg = {
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

      // Merge raw into defaults
      const cfg = {
        ...defaultCfg,
        ...raw,
        author:    { ...defaultCfg.author,    ...raw.author    },
        footer:    { ...defaultCfg.footer,    ...raw.footer    },
        thumbnail: { ...defaultCfg.thumbnail, ...raw.thumbnail },
        image:     { ...defaultCfg.image,     ...raw.image     },
        fields:    Array.isArray(raw.fields) ? raw.fields : defaultCfg.fields
      };

      // Build a new embed with placeholders applied
      const eb = new EmbedBuilder();
      const safe = convertColor(cfg.color || defaultCfg.color);
      if (safe !== null) eb.setColor(safe);

      if (cfg.title) {
        eb.setTitle(
          formatPlaceholders(member, interaction.guild, cfg.title)
        );
      }
      if (cfg.description) {
        eb.setDescription(
          formatPlaceholders(member, interaction.guild, cfg.description)
        );
      }
      if (cfg.fields.length) {
        eb.setFields(
          cfg.fields.map(f => ({
            name:  formatPlaceholders(member, interaction.guild, f.name),
            value: formatPlaceholders(member, interaction.guild, f.value),
            inline: !!f.inline
          }))
        );
      }
      if (cfg.author.name) {
        eb.setAuthor({
          name:    formatPlaceholders(member, interaction.guild, cfg.author.name),
          iconURL: cfg.author.icon_url
        });
      }
      if (cfg.footer.text) {
        eb.setFooter({
          text:    formatPlaceholders(member, interaction.guild, cfg.footer.text),
          iconURL: cfg.footer.icon_url
        });
      }
      if (cfg.thumbnail.url) eb.setThumbnail(cfg.thumbnail.url);
      if (cfg.image.url)     eb.setImage(cfg.image.url);
      if (cfg.timestamp)     eb.setTimestamp();

      formattedEmbed = eb;
    }

    // 6️⃣ Send the test message to the target channel
    await channel.send({
      content: formattedText,
      embeds:  formattedEmbed ? [formattedEmbed] : []
    });

    // 7️⃣ Ack the executor
    await interaction.reply({
      content: `✅ Test **${type}** event sent to ${channel}.`,
      flags: 64
    });
  }
};