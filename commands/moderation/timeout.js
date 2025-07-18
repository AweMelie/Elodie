// commands/moderation/timeout.js
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
    .setName('timeout')
    .setDescription('Timeout a user for a specified duration.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const minutes = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild;
    const member = guild.members.cache.get(targetUser.id);

    // 1️⃣ Ensure target exists
    if (!member) {
      return interaction.reply({
        content: '❌ User not found in this server.',
        flags: 64
      });
    }

    // 2️⃣ Apply timeout
    const msDuration = minutes * 60 * 1000;
    try {
      await member.timeout(msDuration, reason);
    } catch (err) {
      console.error('Timeout error:', err);
      return interaction.reply({
        content: '❌ Failed to timeout that user.',
        flags: 64
      });
    }

    // 3️⃣ Build the embed for logging
    const embed = new EmbedBuilder()
      .setTitle('User Timed Out')
      .setColor(0x3498db)
      .setTimestamp()
      .setDescription([
        `**User:** ${targetUser.tag} (\`${targetUser.id}\`)`,
        `**Moderator:** <@${interaction.user.id}>`,
        `**Duration:** ${minutes} minute(s)`,
        `**Reason:** ${reason}`
      ].join('\n'));

    // 4️⃣ Ensure storage & load config.json
    ensureGuildStorage(guild.id);
    const config = loadConfig(guild.id, 'config.json');
    const logChannelId = config.logChannel;
    const logChannel = logChannelId && guild.channels.cache.get(logChannelId);

    // 5️⃣ Send to log channel or fallback to ephemeral
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
      return interaction.reply(
        `✅ Timed out ${targetUser.tag} for ${minutes}m. Logged in <#${logChannelId}>.`
      );
    }

    return interaction.reply({
      content: [
        `✅ Timed out ${targetUser.tag} for ${minutes}m.`,
        '',
        '> Tip: set up a log channel with `/logchannel`'
      ].join('\n'),
      flags: 64
    });
  }
};