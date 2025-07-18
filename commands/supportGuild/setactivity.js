// commands/supportGuild/setactivity.js
const { SlashCommandBuilder, ActivityType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setactivity')
    .setDescription('Change the bot’s presence/activity (owner only)')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Select activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing',   value: 'PLAYING' },
          { name: 'Streaming', value: 'STREAMING' },
          { name: 'Listening', value: 'LISTENING' },
          { name: 'Watching',  value: 'WATCHING' },
          { name: 'Competing', value: 'COMPETING' }
        )
    )
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('What the bot should display')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Owner-only guard
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ You don’t have permission to run this.',
        ephemeral: true
      });
    }

    // Grab the raw choice, then map to the ActivityType enum
    const typeKey = interaction.options.getString('type');      // e.g. "PLAYING"
    const type    = ActivityType[typeKey];                      // resolves to the numeric enum
    const text    = interaction.options.getString('text');

    // Update the bot’s presence
    await interaction.client.user.setPresence({
      activities: [{ name: text, type }],
      status: 'online'
    });

    // Confirm to the owner
    return interaction.reply({
      content: `✅ Presence updated to **${typeKey.toLowerCase()} ${text}**`,
      ephemeral: true
    });
  }
};