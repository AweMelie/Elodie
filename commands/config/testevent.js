const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../../utils/storageManager');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const convertColor = require('../../utils/convertColor'); // ⬅️ NEW

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

    // 1️⃣ Ensure storage and load configs
    ensureGuildStorage(guildId);
    const events      = loadConfig(guildId, 'server-events.json');
    const savedEmbeds = loadConfig(guildId, 'embeds.json');

    // 2️⃣ Verify channel & message templates exist
    const channelId       = events[`${type}Channel`];
    const messageTemplate = events[`${type}Message`];

    const missing = [];
    if (!channelId)       missing.push('channel');
    if (!messageTemplate) missing.push('message');

    if (missing.length) {
      return interaction.reply({
        content: `Missing ${missing.join(' & ')} for **${type}** event. Use \`/${type}channel\` and \`/${type}message\` to set them.`,
        flags: 64
      });
    }

    // 3️⃣ Resolve channel
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({
        content: `Channel set for ${type} event no longer exists.`,
        flags: 64
      });
    }

    // 4️⃣ Parse out embed placeholder (if any)
    const embedMatch = messageTemplate.match(/\{embed:([\w-]+)\}/);
    const embedName  = embedMatch?.[1];
    const rawMessage = messageTemplate.replace(/\{embed:[\w-]+\}/, '').trim();
    const formatted  = formatPlaceholders(member, interaction.guild, rawMessage);

    // 5️⃣ Load and clean embed if referenced
    let logEmbed = null;
    if (embedName && savedEmbeds[embedName]) {
      const raw = savedEmbeds[embedName];
      const embed = EmbedBuilder.from(raw);

      const safeColor = convertColor(raw.color);
      if (safeColor !== null) embed.setColor(safeColor);

      logEmbed = embed;
    }

    // 6️⃣ Send the test
    await channel.send({
      content: `-# this is a test message\n${formatted}`,
      embeds: logEmbed ? [logEmbed] : []
    });

    // 7️⃣ Confirm to executor
    await interaction.reply({
      content: `✅ Test message sent to ${channel}`,
      flags: 64
    });
  }
};