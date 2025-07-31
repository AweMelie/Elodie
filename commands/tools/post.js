// commands/post.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const { loadConfig } = require('../../utils/storageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('post')
    .setDescription('Post a custom message with optional embeds')
    .addStringOption(option =>
      option.setName('content')
        .setDescription('Message content, use {embed:name} to include saved embeds')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Target channel for the message')
        .setRequired(true)),

  async execute(interaction) {
    const contentRaw = interaction.options.getString('content');
    const channel    = interaction.options.getChannel('channel');
    const guildId    = interaction.guild.id;
    const member     = interaction.member;

    // Check permissions
    if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({
        content: `I can't post in ${channel} — missing Send Messages permission.`,
        ephemeral: true
      });
    }

    // Replace live placeholders
    let finalContent = formatPlaceholders(member, interaction.guild, contentRaw);

    // Load embeds and find {embed:name} tags
    const embeds = loadConfig(guildId, 'embeds.json');
    const embedMatches = [...finalContent.matchAll(/\{embed:([^\}]+)\}/g)];

    const finalEmbeds = [];
    for (const match of embedMatches) {
      const embedName = match[1];
      const rawEmbed = embeds[embedName];
      if (!rawEmbed) continue;

      const builtEmbed = new EmbedBuilder();

      if (rawEmbed.title)
        builtEmbed.setTitle(formatPlaceholders(member, interaction.guild, rawEmbed.title));
      if (rawEmbed.description)
        builtEmbed.setDescription(formatPlaceholders(member, interaction.guild, rawEmbed.description));
      if (rawEmbed.color)
        builtEmbed.setColor(rawEmbed.color);
      if (Array.isArray(rawEmbed.fields))
        builtEmbed.setFields(
          rawEmbed.fields.map(f => ({
            name: formatPlaceholders(member, interaction.guild, f.name),
            value: formatPlaceholders(member, interaction.guild, f.value),
            inline: !!f.inline
          }))
        );
      if (rawEmbed.author?.name)
        builtEmbed.setAuthor({
          name: formatPlaceholders(member, interaction.guild, rawEmbed.author.name),
          iconURL: rawEmbed.author.icon_url
        });
      if (rawEmbed.footer?.text)
        builtEmbed.setFooter({
          text: formatPlaceholders(member, interaction.guild, rawEmbed.footer.text),
          iconURL: rawEmbed.footer.icon_url
        });
      if (rawEmbed.timestamp)
        builtEmbed.setTimestamp();
      if (rawEmbed.image?.url)
        builtEmbed.setImage(rawEmbed.image.url);
      if (rawEmbed.thumbnail?.url)
        builtEmbed.setThumbnail(rawEmbed.thumbnail.url);

      finalEmbeds.push(builtEmbed);
      finalContent = finalContent.replace(match[0], ''); // remove the {embed:name} tag
    }

    // Send the message
    await channel.send({
      content: finalContent || null,
      embeds: finalEmbeds
    });

    await interaction.reply({
      content: `Posted message to ${channel} successfully.`,
      ephemeral: true
    });
  }
};
