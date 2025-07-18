// interactions/modals/setwelcdm_basics.js
const { ModalSubmitInteraction, EmbedBuilder } = require('discord.js');
const {
  loadGlobalWelcome,
  saveGlobalWelcome
} = require('../../utils/storageManager');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const convertColor       = require('../../utils/convertColor');

module.exports = {
  customId: 'setwelcdm_basics',

  async execute(interaction) {
    // default global‐welcome skeleton
    const defaultCfg = {
      title:       null,
      description: null,
      color:       '#00FFFF',
      author:      { name: null,   icon_url: null },
      footer:      { text: null,   icon_url: null },
      image:       { url:  null },
      thumbnail:   { url:  null },
      timestamp:   false
    };
    const loaded = loadGlobalWelcome() || {};
    const cfg    = { ...defaultCfg, ...loaded };

    // gather inputs and merge without wiping others
    cfg.title       = interaction.fields.getTextInputValue('title').trim()       || cfg.title;
    cfg.description = interaction.fields.getTextInputValue('description').trim() || cfg.description;

    const colorInput = interaction.fields.getTextInputValue('color').trim();
    if (colorInput && /^#?[0-9A-F]{6}$/i.test(colorInput)) {
      cfg.color = colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
    }

    saveGlobalWelcome(cfg);

    // rebuild preview
    const embed = new EmbedBuilder();
    const rawHex    = cfg.color || defaultCfg.color;
    const safeColor = convertColor(rawHex);
    if (safeColor !== null) {
      embed.setColor(safeColor);
    }

    if (cfg.title) {
      embed.setTitle(
        formatPlaceholders(interaction.user, interaction.guild, cfg.title)
      );
    }
    if (cfg.description) {
      embed.setDescription(
        formatPlaceholders(interaction.user, interaction.guild, cfg.description)
      );
    }
    if (cfg.author?.name) {
      embed.setAuthor({
        name:    cfg.author.name,
        iconURL: cfg.author.icon_url
      });
    }
    if (cfg.footer?.text) {
      embed.setFooter({
        text:    cfg.footer.text,
        iconURL: cfg.footer.icon_url
      });
    }
    if (cfg.timestamp) {
      embed.setTimestamp();
    }
    if (cfg.image?.url) {
      embed.setImage(cfg.image.url);
    }
    if (cfg.thumbnail?.url) {
      embed.setThumbnail(cfg.thumbnail.url);
    }

    // update the original setup message
    await interaction.update({
      embeds:     [embed],
      components: interaction.message.components
    });
  }
};