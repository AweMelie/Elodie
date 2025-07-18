const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Give someone a warm hug!')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to hug')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');

    if (targetUser.id === interaction.user.id) {
      return await interaction.reply({
        content: '🤗 You hugged yourself... self-love is important!',
        flags: 64 // 💖 Ephemeral and warning-free
      });
    }

    await interaction.reply({
      content: `🤗 <@${interaction.user.id}> hugged <@${targetUser.id}>!`,
      allowedMentions: { users: [interaction.user.id, targetUser.id] }
    });
  }
};
