const { SlashCommandBuilder } = require('discord.js');
const { loadReactionRoles, saveReactionRoles } = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionroleadd')
    .setDescription('📌 Assign a role to users who react on a specific message')
    .addStringOption(opt =>
      opt
        .setName('message')
        .setDescription('Message link or message ID')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('emoji')
        .setDescription('Emoji (Unicode or custom) to react with')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt
        .setName('role')
        .setDescription('Role to assign when reacted')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Permission check
    if (!interaction.member.permissions.has('ManageRoles')) {
      return interaction.reply({ content: '❌ You need Manage Roles permission to use this command.', flags: 64 });
    }

    const input    = interaction.options.getString('message');
    const emoji    = interaction.options.getString('emoji');
    const role     = interaction.options.getRole('role');
    const guildId  = interaction.guild.id;

    let channelId, messageId;

    // Parse full message link or assume message ID
    const match = input.match(/\/channels\/\d+\/(\d+)\/(\d+)/);
    if (match) {
      [, channelId, messageId] = match;
    } else {
      channelId = interaction.channelId;
      messageId = input;
    }

    // Fetch the target channel and message
    let targetChannel;
    try {
      targetChannel = await interaction.client.channels.fetch(channelId);
    } catch {
      return interaction.reply({ content: '❌ Unable to find that channel.', flags: 64 });
    }

    if (!targetChannel.isTextBased()) {
      return interaction.reply({ content: '❌ Target channel is not text-based.', flags: 64 });
    }

    let targetMessage;
    try {
      targetMessage = await targetChannel.messages.fetch(messageId);
    } catch {
      return interaction.reply({ content: '❌ Could not fetch that message.', flags: 64 });
    }

    // React to the message
    let emojiObject;
    try {
      emojiObject = targetMessage.guild.emojis.cache.find(e => e.toString() === emoji) || emoji;
      await targetMessage.react(emojiObject);
    } catch {
      return interaction.reply({ content: '❌ Failed to react — invalid emoji or missing permission.', flags: 64 });
    }

    // Load + update guild reaction-role config
    const config = loadReactionRoles(guildId);

    if (!config[messageId]) config[messageId] = [];
    config[messageId].push({ emoji: emojiObject.toString(), roleId: role.id });

    saveReactionRoles(guildId, config);

    return interaction.reply({
      content: `✅ Added: reacting with ${emojiObject} on [this message] will grant **${role.name}**.`,
      flags: 64
    });
  }
};