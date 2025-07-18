// interactions/modals/setwelcdm_author.js
const { EmbedBuilder } = require('discord.js');
const isImageUrl         = require('../../utils/isImageUrl');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const {
  loadGlobalWelcome,
  saveGlobalWelcome
} = require('../../utils/storageManager');
const convertColor       = require('../../utils/convertColor');

module.exports = {
  customId: 'setwelcdm_author',

  async execute(interaction) {
    // default skeleton
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

    // merge existing config into defaults
    const loaded = loadGlobalWelcome() || {};
    const cfg    = { ...defaultCfg, ...loaded };

    // collect inputs
    const name    = interaction.fields.getTextInputValue('author_text').trim();
    const iconUrl = interaction.fields.getTextInputValue('author_image').trim();

    // validate icon URL
    if (iconUrl && !isImageUrl(iconUrl)) {
      return interaction.reply({
        content: '❌ Invalid author image URL.',
        flags: 64
      });
    }

    // update only author section
    cfg.author = {
      name:     name    || cfg.author.name,
      icon_url: iconUrl || cfg.author.icon_url
    };

    saveGlobalWelcome(cfg);

    // rebuild preview embed
    const embed = new EmbedBuilder();
    const rawHex   = cfg.color || defaultCfg.color;
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

    // update the original setup message in-place
    await interaction.update({
      embeds:     [embed],
      components: interaction.message.components
    });
  }
};