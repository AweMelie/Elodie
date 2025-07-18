// interactions/modals/edit_basics.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const convertColor = require('../../utils/convertColor');

module.exports = {
  customId: 'edit_basics',

  async execute(interaction) {
    const [modalType, embedName] = interaction.customId.split(':');
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

    // Apply basics edits
    const title       = interaction.fields.getTextInputValue('title').trim();
    const description = interaction.fields.getTextInputValue('description').trim();
    const colorInput  = interaction.fields.getTextInputValue('color').trim();

    if (title       !== '') embedData.title       = title;
    if (description !== '') embedData.description = description;
    if (colorInput && /^#?[0-9A-F]{6}$/i.test(colorInput)) {
      embedData.color = colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
    }

    file[embedName] = embedData;
    fs.writeFileSync(embedPath, JSON.stringify(file, null, 2));

    // Rebuild preview
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
        iconURL: embedData.author.icon_url || undefined
      });
    }
    if (embedData.footer?.text) {
      preview.setFooter({
        text   : formatPlaceholders(interaction.member, interaction.guild, embedData.footer.text),
        iconURL: embedData.footer.icon_url || undefined
      });
    }
    if (embedData.timestamp) preview.setTimestamp();
    if (embedData.image?.url) preview.setImage(embedData.image.url);
    if (embedData.thumbnail?.url) preview.setThumbnail(embedData.thumbnail.url);

    // Update any tracked “sent” embed message
    const tracker = fs.existsSync(trackPath)
      ? JSON.parse(fs.readFileSync(trackPath))
      : {};
    const location = tracker[embedName];
    if (location) {
      try {
        const channel = await interaction.client.channels.fetch(location.channelId);
        const message = await channel.messages.fetch(location.messageId);
        await message.edit({ embeds: [preview] });
      } catch (err) {
        if (err.code === 10008) {
          console.warn(`Tracked message for "${embedName}" was deleted.`);
        } else {
          console.error('Failed to update tracked message:', err);
        }
      }
    }

    return interaction.reply({ content: 'Embed updated successfully!', flags: 64 });
  }
};