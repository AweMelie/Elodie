// commands/mod/boostmessage.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boostmessage')
    .setDescription('Set the message that will be sent when a user boosts the server.')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message to display when someone boosts (can include {embed:[name]})')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const messageContent = interaction.options.getString('message');

    // 1️⃣ Ensure storage exists
    ensureGuildStorage(guildId);

    // 2️⃣ Load, update, and save server-events.json
    const events = loadConfig(guildId, 'server-events.json');
    events.boostMessage = messageContent;
    saveConfig(guildId, 'server-events.json', events);

    // 3️⃣ Ephemeral confirmation
    await interaction.reply({
      content: `🚀 Boost message saved!\n\nNew message:\n\`\`\`\n${messageContent}\n\`\`\``,
      flags: 64
    });
  }
};