// commands/config/verifiedrole.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifiedrole')
    .setDescription('Set the role to be given when someone is verified.')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Role to assign on verification')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const guildId = interaction.guild.id;

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load, update, and save config.json
      const config = loadConfig(guildId, 'config.json');
      config.verifiedRole = role.id;
      saveConfig(guildId, 'config.json', config);

      // 3️⃣ Ephemeral confirmation
      await interaction.reply({
        content: `✅ Verified role set to **${role.name}**.`,
        flags: 64
      });
    } catch (err) {
      console.error('Error writing verifiedRole:', err);
      await interaction.reply({
        content: '❌ Failed to set the verified role.',
        flags: 64
      });
    }
  }
};