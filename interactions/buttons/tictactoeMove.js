const renderTictactoeContainer = require('../../utils/containers/renderTictactoeContainer');
const activeGames = require('../../utils/gameState');

const winningCombos = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

function checkWin(board, symbol) {
  return winningCombos.some(combo => combo.every(i => board[i] === symbol));
}

module.exports = {
  customId: /^p_\d+$/,
  async execute(interaction) {
    const game = activeGames.get(interaction.message.id);
    if (!game) {
      return interaction.reply({ content: 'Game not found.', flags: 64 });
    }

    const { challengerId, opponentId, currentTurn, boardState } = game;

    if (![challengerId, opponentId].includes(interaction.user.id)) {
      return interaction.reply({ content: 'You’re not part of this match.', flags: 64 });
    }

    if (interaction.user.id !== currentTurn) {
      return interaction.reply({ content: 'It’s not your turn yet!', flags: 64 });
    }

    const index = parseInt(interaction.customId.split('_')[1]);
    if (boardState[index] !== null) {
      return interaction.reply({ content: 'Someone already played here!', flags: 64 });
    }

    const symbol = currentTurn === challengerId ? 'X' : 'O';
    boardState[index] = symbol;

    const container = renderTictactoeContainer(boardState, challengerId, opponentId);

    // 🏆 Win condition
    if (checkWin(boardState, symbol)) {
      activeGames.delete(interaction.message.id);

      // First update the board with the final move
      await interaction.update(container);

      // Then announce winner
      await interaction.followUp({
        content: `🎉 <@${interaction.user.id}> wins!`,
      });

      // Finally disable buttons on the original message
      for (const row of container.components) {
        for (const button of row.components) {
          if (typeof button?.setDisabled === 'function') {
            button.setDisabled(true);
          }
        }
      }

      await interaction.message.edit(container);
      return;
    }

    // 🤝 Draw condition
    if (boardState.every(cell => cell !== null)) {
      activeGames.delete(interaction.message.id);

      // Update board showing final state
      await interaction.update(container);

      // Announce draw
      await interaction.followUp({
        content: `It's a draw! 🤝`,
      });

      await interaction.message.edit(container);
      return;
    }

    // 🔁 Continue game
    game.currentTurn = currentTurn === challengerId ? opponentId : challengerId;

    await interaction.update(container);
  }
};
