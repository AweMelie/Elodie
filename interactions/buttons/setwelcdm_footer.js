// interactions/buttons/setwelcdm_footer.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { loadGlobalWelcome } = require('../../utils/storageManager');

module.exports = {
  customId: 'setwelcdm_footer',
  async execute(interaction) {
    const cfg    = loadGlobalWelcome() || {};
    const footer = cfg.footer || {};
    const modal = new ModalBuilder()
      .setCustomId('setwelcdm_footer')
      .setTitle('Edit Footer')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('footer_text')
            .setLabel('Footer Text')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(footer.text ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('footer_image')
            .setLabel('Footer Icon URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(footer.icon_url ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('timestamp')
            .setLabel('Add Timestamp? (yes/no)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(cfg.timestamp ? 'yes' : '')
        )
      );
    await interaction.showModal(modal);
  }
};