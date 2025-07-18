// commands/supportGuild/setwelcdm.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const formatPlaceholders   = require('../../utils/formatPlaceholders');
const { loadGlobalWelcome } = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcdm')
    .setDescription('Build or edit the embed DM sent when someone adds the bot'),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '❌ No permission.', flags: 64 });
    }

    // load or fallback defaults
    const defaultCfg = {
      title:       null,
      description: null,
      color:      '#00FFFF',
      fields:      [],
      author:      { name: null, icon_url: null },
      footer:      { text: null, icon_url: null },
      image:       { url: null },
      thumbnail:   { url: null },
      timestamp:  false
    };
    const cfg = loadGlobalWelcome() || defaultCfg;

    // build preview
    const preview = new EmbedBuilder().setColor(cfg.color);
    let hasContent = false;

    if (cfg.title) {
      preview.setTitle(formatPlaceholders(interaction.user, interaction.guild, cfg.title));
      hasContent = true;
    }
    if (cfg.description) {
      preview.setDescription(formatPlaceholders(interaction.user, interaction.guild, cfg.description));
      hasContent = true;
    }
    if (Array.isArray(cfg.fields) && cfg.fields.length) {
      preview.setFields(cfg.fields.map(f => ({
        name:  formatPlaceholders(interaction.user, interaction.guild, f.name),
        value: formatPlaceholders(interaction.user, interaction.guild, f.value),
        inline: f.inline
      })));
      hasContent = true;
    }
    if (cfg.author.name) {
      preview.setAuthor({
        name:    formatPlaceholders(interaction.user, interaction.guild, cfg.author.name),
        iconURL: cfg.author.icon_url
      });
      hasContent = true;
    }
    if (cfg.footer.text) {
      preview.setFooter({
        text:    formatPlaceholders(interaction.user, interaction.guild, cfg.footer.text),
        iconURL: cfg.footer.icon_url
      });
      hasContent = true;
    }
    if (cfg.image.url) {
      preview.setImage(cfg.image.url);
      hasContent = true;
    }
    if (cfg.thumbnail.url) {
      preview.setThumbnail(cfg.thumbnail.url);
      hasContent = true;
    }
    if (cfg.timestamp) {
      preview.setTimestamp();
      hasContent = true;
    }

    // if it truly has no content, give it a placeholder description
    if (!hasContent) {
      preview.setDescription('This embed is empty—click “Edit Title / Desc. / Color” to begin.');
    }

    // split 6 buttons into two rows (max 5 per row)
    const buttons = [
      ['welcdm_basics', 'Edit Title / Desc. / Color', ButtonStyle.Secondary],
      ['welcdm_author', 'Edit Author',               ButtonStyle.Secondary],
      ['welcdm_footer', 'Edit Footer',               ButtonStyle.Secondary],
      ['welcdm_images', 'Edit Images',               ButtonStyle.Secondary],
      ['welcdm_test',   'Test DM',                   ButtonStyle.Primary],
      ['welcdm_save',   'Save Embed',                ButtonStyle.Success]
    ].map(([id, label, style]) =>
      new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style)
    );

    const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 4));
    const row2 = new ActionRowBuilder().addComponents(buttons.slice(4, 6));

    // reply ephemerally with two rows and a valid embed
    await interaction.reply({
      content:    '🛠️ Editing your Welcome-DM embed. Click a button to begin.',
      embeds:     [preview],
      components: [row1, row2],
      flags: 64
    });
  }
};