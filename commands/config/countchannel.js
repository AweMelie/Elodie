// commands/mod/countchannel.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('countchannel')
    .setDescription('Set the channel where counting will take place.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to use for counting')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // 1️⃣ Ensure storage folder & default files
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load, update, and save config.json
      const config = loadConfig(guildId, 'config.json');
      config.countChannel = channel.id;
      saveConfig(guildId, 'config.json', config);

      // 3️⃣ Ephemeral confirmation
      await interaction.reply({
        content: `✅ Counting channel set to <#${channel.id}>.`,
        flags: 64
      });
    } catch (error) {
      console.error('Error updating countChannel:', error);
      await interaction.reply({
        content: '❌ Failed to set the counting channel.',
        flags: 64
      });
    }
  }
};