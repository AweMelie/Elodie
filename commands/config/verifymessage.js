// commands/config/verifymessage.js
const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');
const formatPlaceholders = require('../../utils/formatPlaceholders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifymessage')
    .setDescription('Set the public message that gets sent when a user is verified.')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message content (supports {user}, {server_name}, {embed:name}, etc.)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const messageContent = interaction.options.getString('message');

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load, update, and save server-events.json
      const events = loadConfig(guildId, 'server-events.json');
      events.verifyMessage = messageContent;
      saveConfig(guildId, 'server-events.json', events);

      // 3️⃣ Optional preview for debugging
      const preview = formatPlaceholders(interaction.member, interaction.guild, messageContent);
      console.log(`Verify message preview for guild ${guildId}:`, preview);

      // 4️⃣ Ephemeral confirmation
      await interaction.reply({
        content: `✅ Verify message saved!\n\nNew message:\n\`\`\`\n${messageContent}\n\`\`\``,
        flags: 64
      });
    } catch (err) {
      console.error('Error writing verifyMessage:', err);
      await interaction.reply({
        content: '❌ Failed to save the verify message.',
        flags: 64
      });
    }
  }
};
