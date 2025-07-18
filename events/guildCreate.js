// events/guildCreate.js
const { loadGlobalWelcome } = require('../utils/storageManager');
const { EmbedBuilder }      = require('discord.js');
const formatPlaceholders    = require('../utils/formatPlaceholders');
const convertColor          = require('../utils/convertColor'); // ⬅️ NEW

module.exports = {
  name: 'guildCreate',

  async execute(guild) {
    console.log(`➡️ guildCreate fired for ${guild.id}`);

    // 1️⃣ Load your global welcome-DM config
    const cfg = loadGlobalWelcome();
    if (!cfg) return; // you haven’t run /setwelcdm yet

    try {
      // 2️⃣ Fetch the user who added the bot (the guild owner)
      const owner = await guild.fetchOwner();

      // 3️⃣ Build the embed from that global config
      const embed = new EmbedBuilder();

      // Title & description
      if (cfg.title) {
        embed.setTitle(formatPlaceholders(owner, guild, cfg.title));
      }
      if (cfg.description) {
        embed.setDescription(formatPlaceholders(owner, guild, cfg.description));
      }

      // Safe color conversion (fallback to Discord blurple if none)
      const defaultHex = '#5865F2';
      const rawHex     = cfg.color || defaultHex;
      const safeColor  = convertColor(rawHex);
      if (safeColor !== null) {
        embed.setColor(safeColor);
      }

      // Optional fields array
      if (Array.isArray(cfg.fields) && cfg.fields.length) {
        embed.setFields(
          cfg.fields.map(f => ({
            name:   formatPlaceholders(owner, guild, f.name),
            value:  formatPlaceholders(owner, guild, f.value),
            inline: !!f.inline
          }))
        );
      }

      // Optional author
      if (cfg.author?.name) {
        embed.setAuthor({
          name:    formatPlaceholders(owner, guild, cfg.author.name),
          iconURL: cfg.author.icon_url
        });
      }

      // Optional footer
      if (cfg.footer?.text) {
        embed.setFooter({
          text:    formatPlaceholders(owner, guild, cfg.footer.text),
          iconURL: cfg.footer.icon_url
        });
      }

      // Optional image, thumbnail, timestamp
      if (cfg.image?.url) {
        embed.setImage(cfg.image.url);
      }
      if (cfg.thumbnail?.url) {
        embed.setThumbnail(cfg.thumbnail.url);
      }
      if (cfg.timestamp) {
        embed.setTimestamp();
      }

      // 4️⃣ DM the owner
      await owner.send({ embeds: [embed] });
      console.log(`✅ Sent welcome DM to ${owner.id} for guild ${guild.id}`);
    } catch (err) {
      console.error(`❌ Failed to send welcome DM for guild ${guild.id}:`, err);
    }
  }
};