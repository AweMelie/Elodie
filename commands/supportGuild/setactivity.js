// commands/supportGuild/setactivity.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setactivity')
    .setDescription('Update the bot’s activity status')
    .addStringOption(opt =>
      opt
        .setName('type')
        .setDescription('Type of activity')
        .setRequired(true)
        .addChoices(
          { name: 'Playing',   value: 'PLAYING' },
          { name: 'Listening', value: 'LISTENING' },
          { name: 'Watching',  value: 'WATCHING' }
        )
    )
    .addStringOption(opt =>
      opt
        .setName('text')
        .setDescription('The status text')
        .setRequired(true)
    ),
  async execute(interaction) {
    const type = interaction.options.getString('type');
    const text = interaction.options.getString('text');

    await interaction.client.user.setPresence({
      activities: [{ name: text, type }],
      status: 'online'
    });

    return interaction.reply({
      content: `Activity set to **${type.toLowerCase()} ${text}**`,
      ephemeral: true
    });
  }
};