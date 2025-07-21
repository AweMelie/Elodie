const renderTictactoeContainer = require('../../utils/containers/renderTictactoeContainer');
const activeGames = require('../../utils/gameState');

module.exports = {
  customId: /^tictactoe_(accept|decline)_/,
  async execute(interaction) {
    const [_, action, challengerId, opponentId] = interaction.customId.split('_');

    if (interaction.user.id !== opponentId) {
      return interaction.reply({
        content: 'Only the challenged player can respond!',
        ephemeral: true
      });
    }

    if (action === 'decline') {
      return interaction.update({
        content: `Challenge declined by <@${opponentId}>.`,
        components: []
      });
    }

    const boardState = Array(9).fill(null);
    activeGames.set(interaction.message.id, {
      challengerId,
      opponentId,
      currentTurn: challengerId,
      boardState
    });

    const container = renderTictactoeContainer(boardState, challengerId, opponentId);
    await interaction.update(container);
  }
};
