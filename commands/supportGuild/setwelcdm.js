// commands/supportGuild/setwelcdm.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const formatPlaceholders   = require('../../utils/formatPlaceholders');
const {
  loadGlobalWelcome,
  saveGlobalWelcome
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcdm')
    .setDescription('Build or edit the embed DM sent when someone adds the bot'),

  async execute(interaction) {
    // only the owner can run
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '❌ No permission.', flags: 64 });
    }

    // load or default
    const cfg = loadGlobalWelcome() || {
      title:       null,
      description: null,
      color:       '#00FFFF',
      author:      { name: null, icon_url: null },
      footer:      { text: null, icon_url: null },
      image:       { url: null },
      thumbnail:   { url: null },
      timestamp:   false,
      // new fields:
      setupChannelId: null,
      setupMessageId: null
    };

    // build preview embed
    const preview = new EmbedBuilder()
      .setColor(cfg.color);
    if (cfg.title)       preview.setTitle(formatPlaceholders(interaction.user, interaction.guild, cfg.title));
    if (cfg.description) preview.setDescription(formatPlaceholders(interaction.user, interaction.guild, cfg.description));
    if (cfg.author.name) preview.setAuthor({ name: cfg.author.name, iconURL: cfg.author.icon_url });
    if (cfg.footer.text) preview.setFooter({ text: cfg.footer.text, iconURL: cfg.footer.icon_url });
    if (cfg.timestamp)   preview.setTimestamp();
    if (cfg.image.url)   preview.setImage(cfg.image.url);
    if (cfg.thumbnail.url) preview.setThumbnail(cfg.thumbnail.url);

    // placeholder text if totally empty
    if (!cfg.title && !cfg.description) {
      preview.setDescription('This embed is empty—click an edit button to begin.');
    }

    // buttons
    const labels = [
      ['setwelcdm_basics', 'Edit Title/Desc/Color', ButtonStyle.Secondary],
      ['setwelcdm_author', 'Edit Author',           ButtonStyle.Secondary],
      ['setwelcdm_footer', 'Edit Footer',           ButtonStyle.Secondary],
      ['setwelcdm_images', 'Edit Images',           ButtonStyle.Secondary],
      ['setwelcdm_save',   'Save Embed',            ButtonStyle.Success],
      ['setwelcdm_test',   'Test DM',               ButtonStyle.Primary]
    ].map(([id, label, style]) =>
      new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style)
    );

    const row1 = new ActionRowBuilder().addComponents(labels.slice(0, 4));
    const row2 = new ActionRowBuilder().addComponents(labels.slice(4, 6));

    // if we've already sent this setup message, just edit it
    if (cfg.setupChannelId && cfg.setupMessageId) {
      try {
        const channel = await interaction.client.channels.fetch(cfg.setupChannelId);
        const message = await channel.messages.fetch(cfg.setupMessageId);
        await message.edit({ embeds: [preview], components: [row1, row2] });

        // ack the slash silently
        return interaction.reply({ content: '✅ Configuration updated in place.', flags: 64 });
      } catch {
        // fall through to re-create if fetch/edit fails
      }
    }

    // first time: reply publicly and save its IDs
    const sent = await interaction.reply({
      embeds:     [preview],
      components: [row1, row2],
      ephemeral:  false,
      fetchReply: true
    });

    cfg.setupChannelId = sent.channel.id;
    cfg.setupMessageId = sent.id;
    saveGlobalWelcome(cfg);
  }
};