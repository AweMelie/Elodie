// commands/mod/embededit.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const formatPlaceholders  = require('../../utils/formatPlaceholders');
const convertColor        = require('../../utils/convertColor');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embededit')
    .setDescription('Edit a saved embed by name')
    .addStringOption(option =>
      option
        .setName('embed')
        .setDescription('Choose an embed to edit')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const embedName = interaction.options.getString('embed');
    const guildId   = interaction.guild.id;

    // Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // Load saved embeds
      const embeds = loadConfig(guildId, 'embeds.json') || {};
      if (Object.keys(embeds).length === 0) {
        return interaction.reply({
          content: '❌ No saved embeds found.',
          flags: 64
        });
      }

      // Get the specific embed data
      const rawData = embeds[embedName];
      if (!rawData) {
        return interaction.reply({
          content: `❌ Embed \`${embedName}\` not found.`,
          flags: 64
        });
      }

      // Merge into a full default skeleton to avoid undefineds
      const defaultCfg = {
        title:       null,
        description: null,
        color:       '#5865F2',
        author:      { name: null,   icon_url: null },
        footer:      { text: null,   icon_url: null },
        thumbnail:   { url:  null },
        image:       { url:  null },
        fields:      []
      };
      const embedData = { ...defaultCfg, ...rawData };
      // ensure nested objects exist
      embedData.author    = { ...defaultCfg.author,    ...rawData.author    };
      embedData.footer    = { ...defaultCfg.footer,    ...rawData.footer    };
      embedData.thumbnail = { ...defaultCfg.thumbnail, ...rawData.thumbnail };
      embedData.image     = { ...defaultCfg.image,     ...rawData.image     };
      embedData.fields    = Array.isArray(rawData.fields)
        ? rawData.fields
        : defaultCfg.fields;

      // Build live‐preview embed
      const previewEmbed = new EmbedBuilder();

      // Safe color parsing with fallback
      const hex = embedData.color || defaultCfg.color;
      const safe = convertColor(hex);
      if (safe !== null) {
        previewEmbed.setColor(safe);
      }

      if (embedData.title) {
        previewEmbed.setTitle(
          formatPlaceholders(interaction.member, interaction.guild, embedData.title)
        );
      }
      if (embedData.description) {
        previewEmbed.setDescription(
          formatPlaceholders(interaction.member, interaction.guild, embedData.description)
        );
      }
      if (Array.isArray(embedData.fields) && embedData.fields.length) {
        previewEmbed.setFields(
          embedData.fields.map(f => ({
            name:  formatPlaceholders(interaction.member, interaction.guild, f.name),
            value: formatPlaceholders(interaction.member, interaction.guild, f.value),
            inline: !!f.inline
          }))
        );
      }
      if (embedData.author?.name) {
        previewEmbed.setAuthor({
          name:    formatPlaceholders(interaction.member, interaction.guild, embedData.author.name),
          iconURL: embedData.author.icon_url
        });
      }
      if (embedData.footer?.text) {
        previewEmbed.setFooter({
          text:    formatPlaceholders(interaction.member, interaction.guild, embedData.footer.text),
          iconURL: embedData.footer.icon_url
        });
      }
      if (embedData.thumbnail?.url) {
        previewEmbed.setThumbnail(embedData.thumbnail.url);
      }
      if (embedData.image?.url) {
        previewEmbed.setImage(embedData.image.url);
      }

      // Prepare edit buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`edit_basics:${embedName}`)
          .setLabel('Edit Basic Info')
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`edit_author:${embedName}`)
          .setLabel('Edit Author')
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`edit_footer:${embedName}`)
          .setLabel('Edit Footer')
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`edit_images:${embedName}`)
          .setLabel('Edit Images')
          .setStyle(ButtonStyle.Secondary)
      );

      // Send the edit‐mode preview
      await interaction.reply({
        content: [
          `Editing embed: \`${embedName}\``,
          `Use it in messages with \`{embed:${embedName}}\``,
          `Example: \`Thanks {user}! {embed:${embedName}}\``
        ].join('\n'),
        embeds:     [previewEmbed],
        components: [row],
      });

      // Track this ephemeral preview (if you need to reference it later)
      const sent    = await interaction.fetchReply();
      const tracker = loadConfig(guildId, 'embed-messages.json') || {};
      tracker[embedName] = {
        channelId: sent.channel.id,
        messageId: sent.id
      };
      saveConfig(guildId, 'embed-messages.json', tracker);

    } catch (error) {
      console.error('❌ Error in /embededit:', error);
      const payload = {
        content: 'Something went wrong while editing your embed.',
        flags: 64
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
};