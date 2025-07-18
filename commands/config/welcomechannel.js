// commands/config/welcomechannel.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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
    const guildId = interaction.guild.id;
    const selectedChannel = interaction.options.getChannel('channel');

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    // 2️⃣ Load, update, and save server-events.json
    const events = loadConfig(guildId, 'server-events.json');
    events.welcomeChannel = selectedChannel.id;
    saveConfig(guildId, 'server-events.json', events);

    // 3️⃣ Ephemeral confirmation
    await interaction.reply({
      content: `✅ Welcome messages will be sent to ${selectedChannel}`,
      flags: 64
    });
  }
};