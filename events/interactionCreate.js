const fs = require('fs');
const path = require('path');
const {
  EmbedBuilder,
  ModalBuilder
} = require('discord.js');
const formatPlaceholders = require('../utils/formatPlaceholders');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ─── Autocomplete
    if (interaction.isAutocomplete()) {
      try {
        const focused = interaction.options.getFocused(true);
        const guildId = interaction.guild?.id;
        const embedPath = path.join(__dirname, '..', 'bot-storage', guildId, 'embeds.json');
        let results = [];
        if (fs.existsSync(embedPath)) {
          const embeds = JSON.parse(fs.readFileSync(embedPath));
          results = Object.keys(embeds)
            .filter(n => n.toLowerCase().includes(focused.value.toLowerCase()))
            .slice(0, 25)
            .map(name => ({ name, value: name }));
        }
        await interaction.respond(results);
      } catch (err) {
        if (err.code === 40060 || err.code === 10062) {
          console.warn('⚠️ Autocomplete interaction expired or already responded.');
        } else {
          console.error('❌ Autocomplete failure:', err);
        }
      }
      return;
    }

    // ─── Slash Commands
    if (interaction.isChatInputCommand()) {
      console.log('▶️ Received command:', interaction.commandName);
      console.log(
        '🔑 Loaded commands:',
        [...interaction.client.commands.keys()].join(', ')
      );

      try {
        const cmd = interaction.client.commands.get(interaction.commandName);
        if (!cmd) {
          console.warn(`❌ No handler for ${interaction.commandName}`);
          return interaction.reply({ content: 'Command not found.', flags: 64 });
        }
        await cmd.execute(interaction);
      } catch (error) {
        console.error(`❌ Error running /${interaction.commandName}:`, error);
        if (!interaction.replied && !interaction.deferred) {
          return interaction.reply({ content: 'Something went wrong.', flags: 64 });
        }
      }
      return;
    }

    // ─── Button Interactions
    if (interaction.isButton()) {
      const [action] = interaction.customId.split(':');
      let handler = interaction.client.buttons.get(action);

      // Try matching dynamic buttons (e.g. RegExp-based handlers)
      if (!handler) {
        for (const [key, mod] of interaction.client.buttons.entries()) {
          if (key instanceof RegExp && key.test(interaction.customId)) {
            handler = mod;
            break;
          }
        }
      }

      if (handler) return handler.execute(interaction);
    }

    // ─── Modal Submissions
    if (interaction.isModalSubmit()) {
      const [modalType] = interaction.customId.split(':');
      const handler = interaction.client.modals.get(modalType);
      if (handler) return handler.execute(interaction);
    }
  }
};
