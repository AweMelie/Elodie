// interactions/buttons/setwelcdm_images.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { loadGlobalWelcome } = require('../../utils/storageManager');

module.exports = {
  customId: 'setwelcdm_images',
  async execute(interaction) {
    const cfg       = loadGlobalWelcome() || {};
    const modal     = new ModalBuilder()
      .setCustomId('setwelcdm_images')
      .setTitle('Edit Images')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('main_image')
            .setLabel('Main Image URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(cfg.image?.url ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('thumbnail')
            .setLabel('Thumbnail URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(cfg.thumbnail?.url ?? '')
        )
      );
    await interaction.showModal(modal);
  }
};