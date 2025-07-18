// commands/mod/verifychannel.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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
    const guildId = interaction.guild.id;
    const selectedChannel = interaction.options.getChannel('channel');

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    // 2️⃣ Load, update, and save server-events.json
    const events = loadConfig(guildId, 'server-events.json');
    events.verifyChannel = selectedChannel.id;
    saveConfig(guildId, 'server-events.json', events);

    // 3️⃣ Ephemeral confirmation
    await interaction.reply({
      content: `✅ Verification channel set to ${selectedChannel}`,
      flags: 64
    });
  }
};