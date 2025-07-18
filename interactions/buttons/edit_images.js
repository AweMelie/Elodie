// interactions/buttons/edit_images.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs   = require('fs');
const path = require('path');

module.exports = {
  customId: 'edit_images',

  async execute(interaction) {
    const [, embedName] = interaction.customId.split(':');
    const guildId       = interaction.guild.id;
    const embedPath     = path.join(__dirname, '..', '..', 'bot-storage', guildId, 'embeds.json');

    let data = {};
    if (fs.existsSync(embedPath)) {
      const file = JSON.parse(fs.readFileSync(embedPath));
      data = file[embedName] || {};
    }

    const imageData = data.image || {};
    const thumbData = data.thumbnail || {};

    const modal = new ModalBuilder()
      .setCustomId(`edit_images:${embedName}`)
      .setTitle(`Edit Images for ${embedName}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('main_image')
            .setLabel('Main Image URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(imageData.url ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('thumbnail')
            .setLabel('Thumbnail URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(thumbData.url ?? '')
        )
      );

    return interaction.showModal(modal);
  }
};