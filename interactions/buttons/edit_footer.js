// interactions/buttons/edit_footer.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs   = require('fs');
const path = require('path');

module.exports = {
  customId: 'edit_footer',

  async execute(interaction) {
    const [, embedName] = interaction.customId.split(':');
    const guildId       = interaction.guild.id;
    const embedPath     = path.join(__dirname, '..', '..', 'bot-storage', guildId, 'embeds.json');

    let data = {};
    if (fs.existsSync(embedPath)) {
      const file = JSON.parse(fs.readFileSync(embedPath));
      data = file[embedName] || {};
    }

    const footer = data.footer || {};

    const modal = new ModalBuilder()
      .setCustomId(`edit_footer:${embedName}`)
      .setTitle(`Edit Footer for ${embedName}`)
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
            .setValue(data.timestamp ? 'yes' : '')
        )
      );

    return interaction.showModal(modal);
  }
};