// commands/mod/embedlist.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedlist')
    .setDescription('List all saved embed names for this server.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    // 1️⃣ Ensure storage and load embeds
    ensureGuildStorage(guildId);
    const embeds = loadConfig(guildId, 'embeds.json');
    const names = Object.keys(embeds);

    // 2️⃣ Handle no embeds
    if (names.length === 0) {
      return interaction.reply({
        content: '⚠️ No embeds saved yet.',
        flags: 64
      });
    }

    // 3️⃣ Build and send the list embed
    const listEmbed = new EmbedBuilder()
      .setTitle('📋 Saved Embeds')
      .setDescription(names.map(name => `• \`${name}\``).join('\n'))
      .setColor(0xFFC0CB);

    return interaction.reply({ embeds: [listEmbed] });
  }
};