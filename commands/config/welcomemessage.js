// commands/config/welcomemessage.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcomemessage')
    .setDescription('Set the message that will be sent when a user joins.')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message to display when a user joins (can include {embed:[name]})')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const messageContent = interaction.options.getString('message');

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    // 2️⃣ Load, update, and save server-events.json
    const events = loadConfig(guildId, 'server-events.json');
    events.welcomeMessage = messageContent;
    saveConfig(guildId, 'server-events.json', events);

    // 3️⃣ Ephemeral confirmation
    await interaction.reply({
      content: `🎉 Welcome message saved!\n\nNew message:\n\`\`\`\n${messageContent}\n\`\`\``,
      flags: 64
    });
  }
};