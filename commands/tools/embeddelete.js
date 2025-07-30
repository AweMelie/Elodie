// commands/mod/embeddelete.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ensureGuildStorage,
  loadConfig,
  saveConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embeddelete')
    .setDescription('Delete a saved embed and its tracked message.')
    .addStringOption(option =>
      option
        .setName('embed')
        .setDescription('Choose an embed to delete')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const embedName = interaction.options.getString('embed');
    const guildId   = interaction.guild.id;

    // 1️⃣ Ensure storage folder & default files exist
    ensureGuildStorage(guildId);

    try {
      // 2️⃣ Load saved embeds
      const embeds = loadConfig(guildId, 'embeds.json');
      if (Object.keys(embeds).length === 0) {
        return interaction.reply({
          content: '❌ No saved embeds found.',
          flags: 64
        });
      }

      if (!embeds[embedName]) {
        return interaction.reply({
          content: `❌ Embed \`${embedName}\` not found.`,
          flags: 64
        });
      }

      // 3️⃣ Remove embed and persist
      delete embeds[embedName];
      saveConfig(guildId, 'embeds.json', embeds);

      // 4️⃣ Load tracker, delete posted message if exists
      const tracker = loadConfig(guildId, 'embed-messages.json');
      const location = tracker[embedName];
      if (location) {
        try {
          const channel = await interaction.client.channels.fetch(location.channelId);
          const message = await channel.messages.fetch(location.messageId);
          await message.delete();
        } catch (err) {
          if (err.code === 10008) {
            console.warn(`⚠️ Message for embed "${embedName}" already deleted or missing.`);
          } else {
            console.error(`❌ Unexpected error deleting message for "${embedName}":`, err);
          }
        }
        delete tracker[embedName];
        saveConfig(guildId, 'embed-messages.json', tracker);
      }

      // 5️⃣ Confirm deletion
      return interaction.reply({
        content: `🗑️ Embed \`${embedName}\` deleted.`,
        flags: 64
      });

    } catch (error) {
      console.error('❌ Error during /embeddelete:', error);
      const replyPayload = {
        content: 'Something went wrong while deleting your embed.',
        flags: 64
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload);
      } else {
        await interaction.reply(replyPayload);
      }
    }
  }
};