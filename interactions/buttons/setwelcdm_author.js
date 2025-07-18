// interactions/buttons/setwelcdm_author.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { loadGlobalWelcome } = require('../../utils/storageManager');

module.exports = {
  customId: 'setwelcdm_author',
  async execute(interaction) {
    const cfg = loadGlobalWelcome() || {};
    const author = cfg.author || {};
    const modal = new ModalBuilder()
      .setCustomId('setwelcdm_author')
      .setTitle('Edit Author')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('author_text')
            .setLabel('Author Name')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(author.name ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('author_image')
            .setLabel('Author Icon URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(author.icon_url ?? '')
        )
      );
    await interaction.showModal(modal);
  }
};