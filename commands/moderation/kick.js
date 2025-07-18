// commands/mod/kick.js
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
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild;
    const member = guild.members.cache.get(targetUser.id);

    // 1️⃣ Check member exists
    if (!member) {
      return interaction.reply({
        content: '❌ User not found in this server.',
        flags: 64
      });
    }

    // 2️⃣ Attempt the kick
    try {
      await member.kick(reason);
    } catch (err) {
      console.error('Kick error:', err);
      return interaction.reply({
        content: '❌ Failed to kick that user.',
        flags: 64
      });
    }

    // 3️⃣ Build the embed for logging
    const embed = new EmbedBuilder()
      .setTitle('User Kicked')
      .setColor(0xffa500)
      .setTimestamp()
      .setDescription([
        `**User:** ${targetUser.tag} (\`${targetUser.id}\`)`,
        `**Moderator:** <@${interaction.user.id}>`,
        `**Reason:** ${reason}`
      ].join('\n'));

    // 4️⃣ Ensure storage & load config
    ensureGuildStorage(guild.id);
    const config = loadConfig(guild.id, 'config.json');
    const logChannelId = config.logChannel;
    const logChannel = logChannelId && guild.channels.cache.get(logChannelId);

    // 5️⃣ Send to log channel or fallback to ephemeral
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
      return interaction.reply(
        `✅ Kicked ${targetUser.tag}. Logged in <#${logChannelId}>.`
      );
    }

    return interaction.reply({
      content: [
        `✅ Kicked ${targetUser.tag}`,
        '',
        '> Tip: set up a log channel with `/logchannel`'
      ].join('\n'),
      flags: 64
    });
  }
};