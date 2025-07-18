// commands/supportGuild/setwelcdm.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const formatPlaceholders = require('../../utils/formatPlaceholders');
const {
  ensureGuildStorage,
  loadConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcdm')
    .setDescription('Build or edit the embed DM sent when someone adds the bot'),

  async execute(interaction) {
    // 1️⃣ Owner-only guard
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    }

    // 2️⃣ Ensure storage & load or init draft
    const guildId = interaction.guild.id;
    ensureGuildStorage(guildId);

    const defaultCfg = {
      title: null,
      description: null,
      color: '#00FFFF',
      fields: [],
      author: { name: null, icon_url: null },
      footer: { text: null, icon_url: null },
      image: { url: null },
      thumbnail: { url: null },
      timestamp: false
    };
    const cfg = loadConfig(guildId, 'welcome-embed.json') || defaultCfg;

    // 3️⃣ Build preview embed
    const preview = new EmbedBuilder();
    if (cfg.title)       preview.setTitle(formatPlaceholders(interaction.user, interaction.guild, cfg.title));
    if (cfg.description) preview.setDescription(formatPlaceholders(interaction.user, interaction.guild, cfg.description));
    preview.setColor(cfg.color);

    if (cfg.fields?.length) {
      preview.setFields(
        cfg.fields.map(f => ({
          name:  formatPlaceholders(interaction.user, interaction.guild, f.name),
          value: formatPlaceholders(interaction.user, interaction.guild, f.value),
          inline: f.inline
        }))
      );
    }

    if (cfg.author.name) {
      preview.setAuthor({
        name:    formatPlaceholders(interaction.user, interaction.guild, cfg.author.name),
        iconURL: cfg.author.icon_url
      });
    }

    if (cfg.footer.text) {
      preview.setFooter({
        text:    formatPlaceholders(interaction.user, interaction.guild, cfg.footer.text),
        iconURL: cfg.footer.icon_url
      });
    }

    if (cfg.image.url)     preview.setImage(cfg.image.url);
    if (cfg.thumbnail.url) preview.setThumbnail(cfg.thumbnail.url);
    if (cfg.timestamp)     preview.setTimestamp();

    // 4️⃣ Action buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('welcdm_basics')
        .setLabel('Edit Title / Desc. / Color')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('welcdm_author')
        .setLabel('Edit Author')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('welcdm_footer')
        .setLabel('Edit Footer')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('welcdm_images')
        .setLabel('Edit Images')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('welcdm_test')
        .setLabel('Test DM')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('welcdm_save')
        .setLabel('Save Embed')
        .setStyle(ButtonStyle.Success)
    );

    // 5️⃣ Send the builder message (ephemeral)
    await interaction.reply({
      content: '🛠️ Editing your Welcome-DM embed. Click a button to begin.',
      embeds: [preview],
      components: [row],
    });
  }
};