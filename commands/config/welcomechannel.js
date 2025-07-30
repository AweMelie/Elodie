// commands/config/welcomechannel.js
const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcomechannel')
    .setDescription('Set the channel where welcome messages will be sent.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to send welcome messages into')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const selectedChannel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load, update, and save server-events.json
      const events = loadConfig(guildId, 'server-events.json');
      events.welcomeChannel = selectedChannel.id;
      saveConfig(guildId, 'server-events.json', events);

      // 3️⃣ Confirm silently with proper mention
      await interaction.reply({
        content: `✅ Welcome messages will be sent to ${selectedChannel.toString()}`,
        flags: 64
      });
    } catch (err) {
      console.error('Error writing welcomeChannel:', err);
      await interaction.reply({
        content: '❌ Failed to update the welcome channel.',
        flags: 64
      });
    }
  }
};
