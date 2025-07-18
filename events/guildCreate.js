// events/guildCreate.js
const { ensureGuildStorage, loadConfig } = require('../utils/storageManager');
const { EmbedBuilder }                    = require('discord.js');
const formatPlaceholders                  = require('../utils/formatPlaceholders');

module.exports = {
  name: 'guildCreate',

  async execute(guild) {
    console.log(`➡️ guildCreate fired for ${guild.id}`);

    // Make sure the guild’s data folder exists
    ensureGuildStorage(guild.id);

    // Load the embed you built with /setwelcdm
    const cfg = loadConfig(guild.id, 'welcome-embed.json');
    if (!cfg) return; // nothing configured yet

    try {
      // Fetch the member who invited the bot (guild owner)
      const owner = await guild.fetchOwner();

      // Build the embed from your saved config
      const embed = new EmbedBuilder();

      if (cfg.title) {
        embed.setTitle(
          formatPlaceholders(owner, guild, cfg.title)
        );
      }

      if (cfg.description) {
        embed.setDescription(
          formatPlaceholders(owner, guild, cfg.description)
        );
      }

      embed.setColor(cfg.color || '#00FFFF');

      if (Array.isArray(cfg.fields) && cfg.fields.length) {
        embed.setFields(
          cfg.fields.map(f => ({
            name:  formatPlaceholders(owner, guild, f.name),
            value: formatPlaceholders(owner, guild, f.value),
            inline: f.inline
          }))
        );
      }

      if (cfg.author?.name) {
        embed.setAuthor({
          name:    formatPlaceholders(owner, guild, cfg.author.name),
          iconURL: cfg.author.icon_url
        });
      }

      if (cfg.footer?.text) {
        embed.setFooter({
          text:    formatPlaceholders(owner, guild, cfg.footer.text),
          iconURL: cfg.footer.icon_url
        });
      }

      if (cfg.image?.url) {
        embed.setImage(cfg.image.url);
      }

      if (cfg.thumbnail?.url) {
        embed.setThumbnail(cfg.thumbnail.url);
      }

      if (cfg.timestamp) {
        embed.setTimestamp();
      }

      // Finally, DM the inviter their personalized welcome embed
      await owner.send({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Error sending welcome DM:', error);
    }
  }
};