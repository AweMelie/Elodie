// interactions/buttons/edit_author.js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs   = require('fs');
const path = require('path');

module.exports = {
  customId: 'edit_author',

  async execute(interaction) {
    const [, embedName] = interaction.customId.split(':');
    const guildId       = interaction.guild.id;
    const embedPath     = path.join(__dirname, '..', '..', 'bot-storage', guildId, 'embeds.json');

    let data = {};
    if (fs.existsSync(embedPath)) {
      const file = JSON.parse(fs.readFileSync(embedPath));
      data = file[embedName] || {};
    }

    const author = data.author || {};

    const modal = new ModalBuilder()
      .setCustomId(`edit_author:${embedName}`)
      .setTitle(`Edit Author for ${embedName}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('author_text')
            .setLabel('Author Text')
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

    return interaction.showModal(modal);
  }
};