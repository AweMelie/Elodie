// commands/mod/untimeout.js
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
    .setName('untimeout')
    .setDescription('Remove timeout from a user.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to remove timeout from')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const guild = interaction.guild;
    const member = guild.members.cache.get(targetUser.id);

    // 1️⃣ Check that the member exists
    if (!member) {
      return interaction.reply({
        content: '❌ User not found in this server.',
        flags: 64
      });
    }

    // 2️⃣ Attempt to remove the timeout
    try {
      await member.timeout(null);
    } catch (err) {
      console.error('Untimeout error:', err);
      return interaction.reply({
        content: '❌ Failed to remove timeout.',
        flags: 64
      });
    }

    // 3️⃣ Build the embed for logging
    const embed = new EmbedBuilder()
      .setTitle('User Untimed Out')
      .setColor(0x1abc9c)
      .setTimestamp()
      .setDescription([
        `**User:** ${targetUser.tag} (\`${targetUser.id}\`)`,
        `**Moderator:** <@${interaction.user.id}>`
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
        `✅ Removed timeout from ${targetUser.tag}. Logged in <#${logChannelId}>.`
      );
    }

    return interaction.reply({
      content: [
        `✅ Removed timeout from ${targetUser.tag}`,
        '',
        '> Tip: set up a log channel with `/logchannel`'
      ].join('\n'),
      flags: 64
    });
  }
};