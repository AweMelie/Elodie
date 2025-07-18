// interactions/buttons/setwelcdm_basics.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { loadGlobalWelcome } = require('../../utils/storageManager');

module.exports = {
  customId: 'setwelcdm_basics',
  async execute(interaction) {
    const cfg = loadGlobalWelcome() || {};
    const modal = new ModalBuilder()
      .setCustomId('setwelcdm_basics')
      .setTitle('Edit Title / Description / Color')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Embed Title')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(cfg.title ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Embed Description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(cfg.description ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Color Code (e.g. #00FF00)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(cfg.color ?? '')
        )
      );
    await interaction.showModal(modal);
  }
};