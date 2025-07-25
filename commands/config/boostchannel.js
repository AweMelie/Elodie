// commands/config/boostchannel.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boostchannel')
    .setDescription('Set the channel where boost messages will be sent.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to send boost messages into')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const selectedChannel = interaction.options.getChannel('channel');

    // 1️⃣ Ensure storage exists
    ensureGuildStorage(guildId);

    // 2️⃣ Load, update, and save server-events.json
    const events = loadConfig(guildId, 'server-events.json');
    events.boostChannel = selectedChannel.id;
    saveConfig(guildId, 'server-events.json', events);

    // 3️⃣ Ephemeral confirmation
    await interaction.reply({
      content: `✅ Boost messages will be sent to ${selectedChannel}`,
      flags: 64
    });
  }
};