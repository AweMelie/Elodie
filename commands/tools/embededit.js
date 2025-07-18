// commands/mod/embededit.js
const {
  SlashCommandBuilder,
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

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load saved embeds
      const embeds    = loadConfig(guildId, 'embeds.json');
      if (Object.keys(embeds).length === 0) {
        return interaction.reply({
          content: '❌ No saved embeds found.',
          ephemeral: true
        });
      }
      const embedData = embeds[embedName];
      if (!embedData) {
        return interaction.reply({
          content: `❌ Embed \`${embedName}\` not found.`,
          ephemeral: true
        });
      }

      // 3️⃣ Build live-preview embed
      const previewEmbed = new EmbedBuilder();
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
      if (embedData.color) {
        const safeColor = convertColor(embedData.color);
        if (safeColor !== null) {
          previewEmbed.setColor(safeColor);
        }
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

      // 4️⃣ Prepare edit buttons
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

      // 5️⃣ Send the edit-mode preview
      await interaction.reply({
        content: [
          `Editing embed: \`${embedName}\``,
          `Use it in messages with \`{embed:${embedName}}\``,
          `Example: \`Thanks {user}! {embed:${embedName}}\``
        ].join('\n'),
        embeds:     [previewEmbed],
        components: [row],
        ephemeral:  true
      });

      // 6️⃣ Track this preview message
      const sent    = await interaction.fetchReply();
      const tracker = loadConfig(guildId, 'embed-messages.json');
      tracker[embedName] = {
        channelId: sent.channel.id,
        messageId: sent.id
      };
      saveConfig(guildId, 'embed-messages.json', tracker);

    } catch (error) {
      console.error('❌ Error in /embededit:', error);
      const replyPayload = {
        content: 'Something went wrong while editing your embed.',
        ephemeral: true
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload);
      } else {
        await interaction.reply(replyPayload);
      }
    }
  }
};