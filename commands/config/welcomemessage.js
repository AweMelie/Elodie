// commands/config/welcomemessage.js
const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
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

    ensureGuildStorage(guildId);

    try {
      const events = loadConfig(guildId, 'server-events.json');
      events.welcomeMessage = messageContent;
      saveConfig(guildId, 'server-events.json', events);

      await interaction.reply({
        content: `🎉 Welcome message saved!\n\nNew message:\n\`\`\`\n${messageContent}\n\`\`\``,
        flags: 64
      });
    } catch (err) {
      console.error('Error saving welcomeMessage:', err);
      await interaction.reply({
        content: '❌ Failed to save the welcome message.',
        flags: 64
      });
    }
  }
};
