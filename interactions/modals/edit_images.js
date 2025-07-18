// interactions/modals/edit_images.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const isImageUrl         = require('../../utils/isImageUrl');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const convertColor       = require('../../utils/convertColor');

module.exports = {
  customId: 'edit_images',

  async execute(interaction) {
    const [, embedName] = interaction.customId.split(':');
    const guildId   = interaction.guild.id;
    const embedPath = path.join(__dirname, '..', '..', 'bot-storage', guildId, 'embeds.json');
    const trackPath = path.join(__dirname, '..', '..', 'bot-storage', guildId, 'embed-messages.json');

    if (!fs.existsSync(embedPath)) {
      return interaction.reply({ content: 'Embed not found.', flags: 64 });
    }

    const file      = JSON.parse(fs.readFileSync(embedPath));
    const embedData = file[embedName];
    if (!embedData) {
      return interaction.reply({ content: 'Embed name not found.', flags: 64 });
    }

    const mainUrl = interaction.fields.getTextInputValue('main_image').trim();
    const thumb   = interaction.fields.getTextInputValue('thumbnail').trim();

    if (mainUrl && !isImageUrl(mainUrl)) {
      return interaction.reply({
        content: '❌ “Main Image URL” must be a valid image URL.',
        flags: 64
      });
    }
    if (thumb && !isImageUrl(thumb)) {
      return interaction.reply({
        content: '❌ “Thumbnail URL” must be a valid image URL.',
        flags: 64
      });
    }

    embedData.image     = { url: mainUrl || null };
    embedData.thumbnail = { url: thumb   || null };
    file[embedName]     = embedData;
    fs.writeFileSync(embedPath, JSON.stringify(file, null, 2));

    // rebuild preview
    const preview = new EmbedBuilder();
    if (embedData.title) {
      preview.setTitle(formatPlaceholders(interaction.member, interaction.guild, embedData.title));
    }
    if (embedData.description) {
      preview.setDescription(formatPlaceholders(interaction.member, interaction.guild, embedData.description));
    }
    if (embedData.color) {
      const safeColor = convertColor(embedData.color);
      if (safeColor !== null) preview.setColor(safeColor);
    }
    if (Array.isArray(embedData.fields) && embedData.fields.length) {
      preview.setFields(embedData.fields.map(f => ({
        name  : formatPlaceholders(interaction.member, interaction.guild, f.name),
        value : formatPlaceholders(interaction.member, interaction.guild, f.value),
        inline: !!f.inline
      })));
    }
    if (embedData.author?.name) {
      preview.setAuthor({
        name   : formatPlaceholders(interaction.member, interaction.guild, embedData.author.name),
        iconURL: embedData.author.icon_url
      });
    }
    if (embedData.footer?.text) {
      preview.setFooter({
        text   : formatPlaceholders(interaction.member, interaction.guild, embedData.footer.text),
        iconURL: embedData.footer.icon_url
      });
    }
    if (embedData.timestamp) {
      preview.setTimestamp();
    }
    if (embedData.image?.url) {
      preview.setImage(embedData.image.url);
    }
    if (embedData.thumbnail?.url) {
      preview.setThumbnail(embedData.thumbnail.url);
    }

    // update tracked message
    const tracker  = fs.existsSync(trackPath)
      ? JSON.parse(fs.readFileSync(trackPath))
      : {};
    const location = tracker[embedName];
    if (location) {
      try {
        const channel = await interaction.client.channels.fetch(location.channelId);
        const message = await channel.messages.fetch(location.messageId);
        await message.edit({ embeds: [preview] });
      } catch (err) {
        console.error('Failed to update tracked message:', err);
      }
    }

    return interaction.reply({ content: 'Embed images updated.', flags: 64 });
  }
};