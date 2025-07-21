const renderTictactoeContainer = require('../../utils/containers/renderTictactoeContainer');

const activeGames = new Map();

const winningCombos = [
  [0,1,2], [3,4,5], [6,7,8], // Rows
  [0,3,6], [1,4,7], [2,5,8], // Columns
  [0,4,8], [2,4,6]           // Diagonals
];

function checkWin(board, symbol) {
  return winningCombos.some(combo =>
    combo.every(index => board[index] === symbol)
  );
}

module.exports = {
  customId: /^p_\d+$/,
  async execute(interaction) {
    const game = activeGames.get(interaction.message.id);
    if (!game) return interaction.reply({ content: 'Game not found.', ephemeral: true });

    const { challengerId, opponentId, currentTurn, boardState } = game;

    if (![challengerId, opponentId].includes(interaction.user.id)) {
      return interaction.reply({ content: 'You’re not part of this game!', ephemeral: true });
    }

    if (interaction.user.id !== currentTurn) {
      return interaction.reply({ content: 'Not your turn!', ephemeral: true });
    }

    const index = parseInt(interaction.customId.split('_')[1], 10);
    if (boardState[index] !== null) {
      return interaction.reply({ content: 'This spot is already taken!', ephemeral: true });
    }

    const symbol = currentTurn === challengerId ? 'X' : 'O';
    boardState[index] = symbol;

    // Check for win
    if (checkWin(boardState, symbol)) {
      const container = renderTictactoeContainer(boardState, challengerId, opponentId);
      activeGames.delete(interaction.message.id);

      return interaction.update({
        ...container,
        content: `🎉 <@${interaction.user.id}> wins the match!`,
        components: []
      });
    }

    // Check for draw
    if (boardState.every(cell => cell !== null)) {
      activeGames.delete(interaction.message.id);
      return interaction.update({
        content: `😶 It’s a draw! No winner this time.`,
        components: []
      });
    }

    // Switch turn
    game.currentTurn = interaction.user.id === challengerId ? opponentId : challengerId;

    const container = renderTictactoeContainer(boardState, challengerId, opponentId);
    await interaction.update(container);
  }
};
