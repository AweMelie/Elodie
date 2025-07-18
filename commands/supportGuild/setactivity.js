// commands/supportGuild/setactivity.js
const { SlashCommandBuilder, ActivityType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setactivity')
    .setDescription('Change the bot’s presence/activity (owner only)')
    .addStringOption(opt =>
      opt
        .setName('type')
        .setDescription('Select activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing',   value: 'Playing' },
          { name: 'Streaming', value: 'Streaming' },
          { name: 'Listening', value: 'Listening' },
          { name: 'Watching',  value: 'Watching' },
          { name: 'Competing', value: 'Competing' }
        )
    )
    .addStringOption(opt =>
      opt
        .setName('text')
        .setDescription('What the bot should display')
        .setRequired(true)
    ),

  async execute(interaction) {
    // owner-only guard
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ You don’t have permission to run this.',
        flags: 64
      });
    }

    // This will be one of: "Playing", "Streaming", ...
    const typeKey = interaction.options.getString('type');
    const text    = interaction.options.getString('text');

    // Dynamically map to the numeric enum
    const type = ActivityType[typeKey];
    if (typeof type !== 'number') {
      return interaction.reply({
        content: '❌ Invalid activity type.',
        flags: 64
      });
    }

    // Set the presence
    await interaction.client.user.setPresence({
      activities: [{ name: text, type }],
      status: 'online'
    });

    return interaction.reply({
      content: `✅ Presence updated to **${typeKey.toLowerCase()} ${text}**`,
      flags: 64
    });
  }
};