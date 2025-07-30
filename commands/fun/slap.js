const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const getGif = require('../../utils/getGif'); // adjust path if needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Slap another user with a random object.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to slap')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');

    const gifUrl = await getGif('anime slap');

    const objects = [
      'a NFT of a screaming pigeon',
      'a hoodie that smells like teenage regret',
      'a slightly damp beanbag chair',
      'a VHS tape of Shrek in French',
      'a ceremonial slipper of judgment',
      'a scented candle named “Tax Evasion”',
      'an expired tub of hummus',
      'a pancake shaped like Canada',
      "grandma's collection of expired coupons",
      'a life-sized plush avocado',
      'a glow in the dark banana',
      'a rejected friendship bracelet',
      'a life-sized cardboard cutout of Nicolas Cage',
      "a PDF of the bot's terms of service",
    ];

    const randomObject = objects[Math.floor(Math.random() * objects.length)];

    if (targetUser.id === interaction.user.id) {
      const embed = new EmbedBuilder()
        .setDescription('😵 You tried to slap yourself... everything okay?')
        .setImage(gifUrl || null);

      return await interaction.reply({
        embeds: [embed],
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setDescription(`💢 <@${interaction.user.id}> slapped <@${targetUser.id}> with ${randomObject}!`)
      .setImage(gifUrl || null);

    await interaction.reply({
      embeds: [embed],
      allowedMentions: { users: [interaction.user.id, targetUser.id] }
    });
  }
};
