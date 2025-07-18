// interactions/buttons/setwelcdm_test.js
const { loadGlobalWelcome } = require('../../utils/storageManager');
const { EmbedBuilder }      = require('discord.js');
const formatPlaceholders    = require('../../utils/formatPlaceholders');

module.exports = {
  customId: 'setwelcdm_test',
  async execute(interaction) {
    const cfg = loadGlobalWelcome() || {};
    const embed = new EmbedBuilder().setColor(cfg.color);
    if (cfg.title)       embed.setTitle(formatPlaceholders(interaction.user, interaction.guild, cfg.title));
    if (cfg.description) embed.setDescription(formatPlaceholders(interaction.user, interaction.guild, cfg.description));
    if (cfg.author.name) embed.setAuthor({ name: cfg.author.name, iconURL: cfg.author.icon_url });
    if (cfg.footer.text) embed.setFooter({ text: cfg.footer.text, iconURL: cfg.footer.icon_url });
    if (cfg.timestamp)   embed.setTimestamp();
    if (cfg.image.url)   embed.setImage(cfg.image.url);
    if (cfg.thumbnail.url) embed.setThumbnail(cfg.thumbnail.url);

    await interaction.user.send({ embeds: [embed] });
    await interaction.reply({ content: '📬 Test DM sent to you!', flags: 64 });
  }
};