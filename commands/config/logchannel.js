// commands/config/logchannel.js
const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logchannel')
    .setDescription('Set the moderation logs channel for this server.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send moderation logs')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load, update, and save config.json
      const config = loadConfig(guildId, 'config.json');
      config.logChannel = channel.id;
      saveConfig(guildId, 'config.json', config);

      // 3️⃣ Confirm silently
      await interaction.reply({
        content: `✅ Moderation logs will be sent to <#${channel.id}>.`,
        flags: 64
      });
    } catch (error) {
      console.error('Error updating log channel:', error);
      await interaction.reply({
        content: '❌ Failed to update the log channel.',
        flags: 64
      });
    }
  }
};
