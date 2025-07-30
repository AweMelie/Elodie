const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const getGif = require('../../utils/getGif'); // adjust path as needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Give someone a warm anime-style hug!')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to hug')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');

    // 💞 Anime-style hug only!
    const gifUrl = await getGif('anime hug cute');

    // 🫂 Self-hug logic
    if (targetUser.id === interaction.user.id) {
      const embed = new EmbedBuilder()
        .setDescription(`🤗 You hugged yourself... self-love is important!`)
        .setImage(gifUrl || null);

      return await interaction.reply({
        embeds: [embed],
        flags: 64
      });
    }

    // 💖 Hug someone else!
    const embed = new EmbedBuilder()
      .setDescription(`🤗 <@${interaction.user.id}> hugged <@${targetUser.id}>!`)
      .setImage(gifUrl || null);

    await interaction.reply({
      embeds: [embed],
      allowedMentions: { users: [interaction.user.id, targetUser.id] }
    });
  }
};
