module.exports = function renderTictactoeContainer(boardState = Array(9).fill(null), challengerId, challengeeId) {
  const buttons = boardState.map((cell, i) => ({
    type: 2,
    style: 2,
    label:
      cell === 'X' ? '❌' :
      cell === 'O' ? '⭕' :
      '\u200B',
    custom_id: `p_${i}`,
    disabled: cell !== null,
    flow: { actions: [] }
  }));

  const rows = [0, 1, 2].map(r => ({
    type: 1,
    components: buttons.slice(r * 3, r * 3 + 3)
  }));

  return {
    flags: 32768,
    components: [
      {
        type: 17,
        components: [
          {
            type: 10,
            content: `## Tic Tac Toe Challenge\n### <@${challengerId}>❌ vs <@${challengeeId}>⭕`
          },
          ...rows
        ],
        accent_color: 15443616
      }
    ],
    allowed_mentions: {
      parse: ['users'],
      users: []
    }
  };
};
