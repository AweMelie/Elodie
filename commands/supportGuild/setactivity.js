const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ACTIVITY_PATH = path.join(__dirname, '..', '..', 'bot-storage', 'presence.json');

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
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ You don’t have permission to run this.',
        flags: 64
      });
    }

    const typeKey = interaction.options.getString('type');
    const text    = interaction.options.getString('text');
    const type    = ActivityType[typeKey];

    if (typeof type !== 'number') {
      return interaction.reply({
        content: '❌ Invalid activity type.',
        flags: 64
      });
    }

    await interaction.client.user.setPresence({
      activities: [{ name: text, type }],
      status: 'online'
    });

    const activityData = { type: typeKey, text };
    fs.writeFileSync(ACTIVITY_PATH, JSON.stringify(activityData, null, 2));

    return interaction.reply({
      content: `✅ Presence updated to **${typeKey.toLowerCase()} ${text}** and saved.`,
      flags: 64
    });
  }
};