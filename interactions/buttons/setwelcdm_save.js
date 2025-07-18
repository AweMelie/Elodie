// interactions/buttons/setwelcdm_save.js
const { saveGlobalWelcome, loadGlobalWelcome } = require('../../utils/storageManager');

module.exports = {
  customId: 'setwelcdm_save',
  async execute(interaction) {
    // persisted as we go, but confirm to owner
    const cfg = loadGlobalWelcome();
    saveGlobalWelcome(cfg);
    await interaction.reply({ content: '✅ Welcome-DM embed saved!', flags: 64 });
  }
};