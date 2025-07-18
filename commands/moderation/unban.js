// commands/mod/unban.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID.')
    .addStringOption(option =>
      option
        .setName('userid')
        .setDescription('The ID of the user to unban')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const guild = interaction.guild;

    // 1️⃣ Try to unban
    let targetUser;
    try {
      targetUser = await guild.client.users.fetch(userId);
      await guild.members.unban(userId);
    } catch (err) {
      console.error('Unban error:', err);
      return interaction.reply({
        content: '❌ Failed to unban. Make sure the ID is correct and the user is banned.',
        flags: 64
      });
    }

    // 2️⃣ Build the embed for logging
    const embed = new EmbedBuilder()
      .setTitle('User Unbanned')
      .setColor(0x00ff99)
      .setTimestamp()
      .setDescription([
        `**User:** ${targetUser.tag} (\`${userId}\`)`,
        `**Moderator:** <@${interaction.user.id}>`
      ].join('\n'));

    // 3️⃣ Ensure storage & load config.json
    ensureGuildStorage(guild.id);
    const config = loadConfig(guild.id, 'config.json');
    const logChannelId = config.logChannel;
    const logChannel = logChannelId && guild.channels.cache.get(logChannelId);

    // 4️⃣ Send to log channel or fallback
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
      return interaction.reply(
        `✅ Unbanned <@${userId}>. Logged in <#${logChannelId}>.`
      );
    }

    // Fallback: ephemeral reply with tip
    return interaction.reply({
      content: [
        `✅ Unbanned <@${userId}>`,
        '',
        '> Tip: set up a log channel with `/logchannel`'
      ].join('\n'),
      flags: 64
    });
  }
};