const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'storage', 'reactionRoles.json');

// Ensure storage file exists
if (!fs.existsSync(CONFIG_PATH)) fs.writeFileSync(CONFIG_PATH, '{}');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionroleadd')
    .setDescription('📌 Assign a role to users who react on a message')
    .addStringOption(opt =>
      opt
        .setName('message')
        .setDescription('Message link or message ID')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt
        .setName('role')
        .setDescription('Role to assign on reaction')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('emoji')
        .setDescription('Emoji (unicode or custom) to use')
        .setRequired(true)
    ),

  async execute(interaction) {
    // owner/admin guard
    if (!interaction.member.permissions.has('ManageRoles')) {
      return interaction.reply({ content: '❌ You need Manage Roles permission.', ephemeral: true });
    }

    const input   = interaction.options.getString('message');
    const role    = interaction.options.getRole('role');
    const emoji   = interaction.options.getString('emoji');
    let guildId, channelId, messageId;

    // Parse a full link: https://discord.com/channels/<guildId>/<channelId>/<messageId>
    const linkMatch = input.match(/\/channels\/(\d+)\/(\d+)\/(\d+)/);
    if (linkMatch) {
      [, guildId, channelId, messageId] = linkMatch;
    } else {
      // assume current channel + raw messageId
      guildId   = interaction.guildId;
      channelId = interaction.channelId;
      messageId = input;
    }

    // Fetch the message
    const channel = await interaction.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({ content: '❌ Unable to find that channel.', ephemeral: true });
    }

    let message;
    try {
      message = await channel.messages.fetch(messageId);
    } catch {
      return interaction.reply({ content: '❌ Message not found.', ephemeral: true });
    }

    // React to the message
    let reactEmoji = emoji;
    try {
      reactEmoji = message.guild.emojis.cache.get(emoji) || emoji;
      await message.react(reactEmoji);
    } catch {
      return interaction.reply({ content: '❌ Invalid emoji or missing permissions to react.', ephemeral: true });
    }

    // Load & update storage
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    config[messageId] = config[messageId] || [];
    config[messageId].push({
      emoji: reactEmoji.toString(),
      roleId: role.id
    });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    return interaction.reply({
      content: `✅ Added reaction-role: reacting with ${reactEmoji} on [that message] will grant the **${role.name}** role.`,
      ephemeral: true
    });
  }
};