// commands/moderation/ban.js
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
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild;
    const member = guild.members.cache.get(targetUser.id);

    // 1️⃣ Verify the target is in the guild
    if (!member) {
      return interaction.reply({
        content: '❌ User not found in this server.',
        flags: 64
      });
    }

    // 2️⃣ Attempt the ban
    try {
      await member.ban({ reason });
    } catch (err) {
      console.error('Ban error:', err);
      return interaction.reply({
        content: '❌ Failed to ban that user.',
        flags: 64
      });
    }

    // 3️⃣ Build your embed
    const embed = new EmbedBuilder()
      .setTitle('User Banned')
      .setColor(0xff0000)
      .setTimestamp()
      .setDescription([
        `**User:** ${targetUser.tag} (\`${targetUser.id}\`)`,
        `**Moderator:** <@${interaction.user.id}>`,
        `**Reason:** ${reason}`
      ].join('\n'));

    // 4️⃣ Load storage & config
    ensureGuildStorage(guild.id);
    const config = loadConfig(guild.id, 'config.json');
    const logChannelId = config.logChannel;
    const logChannel = logChannelId && guild.channels.cache.get(logChannelId);

    // 5️⃣ If a log channel exists, send embed there and reply publicly
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
      return interaction.reply(
        `✅ Banned ${targetUser.tag}. Logged in <#${logChannelId}>.`
      );
    }

    // 6️⃣ Fallback: no log channel → ephemeral with grey tip
    return interaction.reply({
      content: [
        `✅ Banned ${targetUser.tag}`,
        '',
        '> Tip: set up a log channel with `/logchannel`'
      ].join('\n'),
      flags: 64
    });
  }
};