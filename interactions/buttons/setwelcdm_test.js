// interactions/buttons/setwelcdm_test.js
const { loadGlobalWelcome } = require('../../utils/storageManager');
const { EmbedBuilder }      = require('discord.js');
const formatPlaceholders    = require('../../utils/formatPlaceholders');
const convertColor          = require('../../utils/convertColor');

module.exports = {
  customId: 'setwelcdm_test',
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

    // build embed with safe color
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

    // send test DM
    await interaction.user.send({ embeds: [embed] });
    await interaction.reply({ content: '📬 Test DM sent to you!', flags: 64 });
  }
};