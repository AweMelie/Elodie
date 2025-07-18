// interactions/buttons/edit_basics.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs   = require('fs');
const path = require('path');

module.exports = {
  customId: 'edit_basics',

  async execute(interaction) {
    const [, embedName] = interaction.customId.split(':');
    const guildId       = interaction.guild.id;
    const embedPath     = path.join(__dirname, '..', '..', 'bot-storage', guildId, 'embeds.json');

    let data = {};
    if (fs.existsSync(embedPath)) {
      const file = JSON.parse(fs.readFileSync(embedPath));
      data = file[embedName] || {};
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_basics:${embedName}`)
      .setTitle(`Editing ${embedName}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.title ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(data.description ?? '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Color Code (e.g. #FFC0CB)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.color ?? '')
        )
      );

    return interaction.showModal(modal);
  }
};