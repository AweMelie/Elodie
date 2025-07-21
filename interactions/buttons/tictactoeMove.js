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
      return interaction.reply({ content: 'Game not found.', ephemeral: true });
    }

    const { challengerId, opponentId, currentTurn, boardState } = game;

    if (![challengerId, opponentId].includes(interaction.user.id)) {
      return interaction.reply({ content: 'You’re not part of this match.', ephemeral: true });
    }

    if (interaction.user.id !== currentTurn) {
      return interaction.reply({ content: 'It’s not your turn yet!', ephemeral: true });
    }

    const index = parseInt(interaction.customId.split('_')[1]);
    if (boardState[index] !== null) {
      return interaction.reply({ content: 'Someone already played here!', ephemeral: true });
    }

    const symbol = currentTurn === challengerId ? 'X' : 'O';
    boardState[index] = symbol;

    if (checkWin(boardState, symbol)) {
      const container = renderTictactoeContainer(boardState, challengerId, opponentId);
      activeGames.delete(interaction.message.id);

      return interaction.update({
        ...container,
        content: `🎉 <@${interaction.user.id}> wins!`,
        components: []
      });
    }

    if (boardState.every(cell => cell !== null)) {
      activeGames.delete(interaction.message.id);
      return interaction.update({
        content: `It's a draw! 🤝`,
        components: []
      });
    }

    game.currentTurn = currentTurn === challengerId ? opponentId : challengerId;

    const container = renderTictactoeContainer(boardState, challengerId, opponentId);
    await interaction.update(container);
  }
};
