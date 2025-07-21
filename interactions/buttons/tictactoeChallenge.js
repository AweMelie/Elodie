const renderTictactoeContainer = require('../../utils/containers/renderTictactoeContainer');
const activeGames = require('../../utils/gameState');

module.exports = {
  customId: /^tictactoe_(accept|decline)_/,
  async execute(interaction) {
    const [_, action, challengerId, opponentId] = interaction.customId.split('_');

    // 🛑 Wrong person clicked — show ephemeral warning, keep message
    if (interaction.user.id !== opponentId) {
      return interaction.reply({
        content: 'Only the challenged player can respond!',
        ephemeral: true
      });
    }

    // 🧹 Remove the challenge message no matter what
    try {
      await interaction.message.delete();
    } catch (err) {
      console.warn('⚠️ Could not delete challenge message:', err);
    }

    // ❌ Decline button pressed
    if (action === 'decline') {
      return interaction.channel.send({
        content: `❌ Challenge declined by <@${opponentId}>.`
      });
    }

    // 🧠 Start new game session
    const boardState = Array(9).fill(null);

    // 🎮 Send game container as new message
    const container = renderTictactoeContainer(boardState, challengerId, opponentId);
    const sentMessage = await interaction.channel.send(container);

    // 🧠 Register game state using new board message ID
    activeGames.set(sentMessage.id, {
      challengerId,
      opponentId,
      currentTurn: challengerId,
      boardState
    });
  }
};
