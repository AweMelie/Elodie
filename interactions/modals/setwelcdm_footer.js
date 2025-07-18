// interactions/modals/setwelcdm_footer.js
const { EmbedBuilder } = require('discord.js');
const isImageUrl          = require('../../utils/isImageUrl');
const formatPlaceholders  = require('../../utils/formatPlaceholders');
const { loadGlobalWelcome, saveGlobalWelcome } = require('../../utils/storageManager');
const convertColor        = require('../../utils/convertColor');

module.exports = {
  customId: 'setwelcdm_footer',

  async execute(interaction) {
    const cfg     = loadGlobalWelcome() || {};
    const text    = interaction.fields.getTextInputValue('footer_text').trim();
    const iconUrl = interaction.fields.getTextInputValue('footer_image').trim();
    const tsInput = interaction.fields.getTextInputValue('timestamp').trim().toLowerCase();

    if (iconUrl && !isImageUrl(iconUrl)) {
      return interaction.reply({ content: '❌ Invalid footer icon URL.', flags: 64 });
    }

    cfg.footer    = { text: text || cfg.footer?.text, icon_url: iconUrl || cfg.footer?.icon_url };
    cfg.timestamp = tsInput === 'yes';
    saveGlobalWelcome(cfg);

    // rebuild preview
    const embed     = new EmbedBuilder();
    const safeColor = convertColor(cfg.color);
    if (safeColor !== null) {
      embed.setColor(safeColor);
    }

    if (cfg.title) {
      embed.setTitle(formatPlaceholders(interaction.user, interaction.guild, cfg.title));
    }
    if (cfg.description) {
      embed.setDescription(formatPlaceholders(interaction.user, interaction.guild, cfg.description));
    }
    if (cfg.author?.name) {
      embed.setAuthor({ name: cfg.author.name, iconURL: cfg.author.icon_url });
    }
    if (cfg.footer?.text) {
      embed.setFooter({ text: cfg.footer.text, iconURL: cfg.footer.icon_url });
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

    await interaction.update({
      embeds:     [embed],
      components: interaction.message.components
    });
  }
};