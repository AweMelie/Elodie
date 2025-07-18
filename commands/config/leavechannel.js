// commands/mod/leavechannel.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leavechannel')
    .setDescription('Set the channel where leave messages will be sent.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to send leave messages into')
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
    events.leaveChannel = selectedChannel.id;
    saveConfig(guildId, 'server-events.json', events);

    // 3️⃣ Ephemeral confirmation
    await interaction.reply({
      content: `✅ Leave messages will be sent to ${selectedChannel}`,
      flags: 64
    });
  }
};