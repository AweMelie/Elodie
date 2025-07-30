// commands/config/verifychannel.js
const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifychannel')
    .setDescription('Set the channel where the verification message will be sent.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to send verification messages into')
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
      events.verifyChannel = selectedChannel.id;
      saveConfig(guildId, 'server-events.json', events);

      // 3️⃣ Ephemeral confirmation (now with proper mention formatting)
      await interaction.reply({
        content: `✅ Verification channel set to ${selectedChannel.toString()}`,
        flags: 64
      });
    } catch (err) {
      console.error('Error writing verifyChannel:', err);
      await interaction.reply({
        content: '❌ Failed to set the verification channel.',
        flags: 64
      });
    }
  }
};
