const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('variables')
    .setDescription('View all supported placeholder variables for event messages.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📦 Supported Variables')
      .setDescription('Use these in event messages or embeds.\nValues are replaced dynamically.')
      .setColor(0xFFC0CB)
      .addFields(
        {
          name: '👤 User Info',
          value: [
            '`{user}` - Mention the user',
            '`{user_name}` - Discord username',
            '`{user_nick}` - Display nickname',
            '`{user_id}` - User ID',
            '`{user_joined}` - Join date & time',
            '`{user_created}` - Account creation date'
          ].join('\n')
        },
        {
          name: '🌐 Server Info',
          value: [
            '`{server_name}` - Server name',
            '`{server_id}` - Server ID',
            '`{server_members}` - Member count',
            '`{server_members_ordinal}` - Member count as ordinal',
            '`{server_humans}` - Non-bot members',
            '`{server_humans_ordinal}` - Non-bots as ordinal',
            '`{server_icon}` - Server icon URL',
            '`{server_create}` - Server creation date'
          ].join('\n')
        },
        {
          name: '🚀 Boost Info',
          value: [
            '`{boost_count}` - Total boosts',
            '`{boost_level}` - Boost level'
          ].join('\n')
        },
        {
          name: '🎨 Formatting',
          value: [
            '`{new_line}` - Adds a line break',
            '`{embed:}` - Includes saved embed'
          ].join('\n')
        }
      );

    await interaction.reply({
      embeds: [embed],
    });
  }
};
