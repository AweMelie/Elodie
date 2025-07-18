const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const convertColor = require('../../utils/convertColor'); // ⬅️ NEW
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedcreate')
    .setDescription('Create and name a reusable embed with live variable preview.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Unique name to reference this embed later')
        .setRequired(true)
    ),

  async execute(interaction) {
    const embedName = interaction.options.getString('name');
    const guildId   = interaction.guild.id;

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load existing embeds and enforce limits
      const embeds = loadConfig(guildId, 'embeds.json');
      if (Object.keys(embeds).length >= 6) {
        return interaction.reply({
          content: 'You can only create up to 6 embeds. Please delete one first.',
          flags: 64
        });
      }
      if (embeds[embedName]) {
        return interaction.reply({
          content: `An embed named \`${embedName}\` already exists.`,
          flags: 64
        });
      }

      // 3️⃣ Initialize raw template and persist
      const rawEmbed = {
        title: "Let's get editing!:tulip:",
        color: '#FFC0CB'
      };
      embeds[embedName] = rawEmbed;
      saveConfig(guildId, 'embeds.json', embeds);

      // 4️⃣ Build the preview embed
      const previewEmbed = new EmbedBuilder();
      if (rawEmbed.title) {
        previewEmbed.setTitle(
          formatPlaceholders(interaction.member, interaction.guild, rawEmbed.title)
        );
      }
      if (rawEmbed.description) {
        previewEmbed.setDescription(
          formatPlaceholders(interaction.member, interaction.guild, rawEmbed.description)
        );
      }
      const safeColor = convertColor(rawEmbed.color); // ⬅️ NEW
      if (safeColor !== null) previewEmbed.setColor(safeColor);

      if (Array.isArray(rawEmbed.fields) && rawEmbed.fields.length) {
        previewEmbed.setFields(
          rawEmbed.fields.map(f => ({
            name:  formatPlaceholders(interaction.member, interaction.guild, f.name),
            value: formatPlaceholders(interaction.member, interaction.guild, f.value),
            inline: !!f.inline
          }))
        );
      }
      if (rawEmbed.author?.name) {
        previewEmbed.setAuthor({
          name:    formatPlaceholders(interaction.member, interaction.guild, rawEmbed.author.name),
          iconURL: rawEmbed.author.icon_url
        });
      }
      if (rawEmbed.footer?.text) {
        previewEmbed.setFooter({
          text:    formatPlaceholders(interaction.member, interaction.guild, rawEmbed.footer.text),
          iconURL: rawEmbed.footer.icon_url
        });
      }
      if (rawEmbed.timestamp) {
        previewEmbed.setTimestamp();
      }
      if (rawEmbed.image?.url) {
        previewEmbed.setImage(rawEmbed.image.url);
      }
      if (rawEmbed.thumbnail?.url) {
        previewEmbed.setThumbnail(rawEmbed.thumbnail.url);
      }

      // 5️⃣ Prepare edit buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`edit_basics:${embedName}`)
          .setLabel('Edit the Basic Info (Title / Description / Color)')
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

      // 6️⃣ Send preview and track it
      await interaction.reply({
        content: [
          `Embed \`${embedName}\` created!`,
          `Use it with \`{embed:${embedName}}\``,
          `Example: \`Thanks {user}! {embed:${embedName}}\``
        ].join('\n'),
        embeds: [previewEmbed],
        components: [row]
      });

      const sent = await interaction.fetchReply();
      const tracker = loadConfig(guildId, 'embed-messages.json');
      tracker[embedName] = {
        channelId: sent.channel.id,
        messageId: sent.id
      };
      saveConfig(guildId, 'embed-messages.json', tracker);

    } catch (error) {
      console.error('❌ Error in /embedcreate:', error);
      const replyPayload = {
        content: 'Something went wrong while creating your embed.',
        flags: 64
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload);
      } else {
        await interaction.reply(replyPayload);
      }
    }
  }
};