// events/guildCreate.js
const { loadGlobalWelcome } = require('../utils/storageManager');
const { EmbedBuilder }      = require('discord.js');
const formatPlaceholders    = require('../utils/formatPlaceholders');

module.exports = {
  name: 'guildCreate',

  async execute(guild) {
    console.log(`➡️ guildCreate fired for ${guild.id}`);

    // 1️⃣ Load your global welcome-DM config
    const cfg = loadGlobalWelcome();
    if (!cfg) return; // you haven't run /setwelcdm yet

    try {
      // 2️⃣ Fetch the user who added the bot (the guild owner)
      const owner = await guild.fetchOwner();

      // 3️⃣ Build the embed from that global config
      const embed = new EmbedBuilder();
      if (cfg.title)       embed.setTitle(formatPlaceholders(owner, guild, cfg.title));
      if (cfg.description) embed.setDescription(formatPlaceholders(owner, guild, cfg.description));
      embed.setColor(cfg.color || '#5865F2');

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

      if (cfg.image?.url)     embed.setImage(cfg.image.url);
      if (cfg.thumbnail?.url) embed.setThumbnail(cfg.thumbnail.url);
      if (cfg.timestamp)      embed.setTimestamp();

      // 4️⃣ DM the owner
      await owner.send({ embeds: [embed] });
      console.log(`✅ Sent welcome DM to ${owner.id} for guild ${guild.id}`);
    } catch (err) {
      console.error(`❌ Failed to send welcome DM for guild ${guild.id}:`, err);
    }
  }
};