const { SlashCommandBuilder } = require('@discordjs/builders');
const activeGames = require('../../utils/gameState');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Challenge someone to Tic Tac Toe!')
    .addUserOption(option =>
      option.setName('opponent')
        .setDescription('Your challenger')
        .setRequired(true)
    ),

  async execute(interaction) {
    const challengerId = interaction.user.id;
    const opponent = interaction.options.getUser('opponent');

    if (challengerId === opponent.id) {
      return interaction.reply({
        content: 'You can’t challenge yourself, Elodie says no-no 🚫',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `<@${opponent.id}>, <@${challengerId}> wants to battle you in Tic Tac Toe!`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: 'Accept',
              custom_id: `tictactoe_accept_${challengerId}_${opponent.id}`
            },
            {
              type: 2,
              style: 4,
              label: 'Decline',
              custom_id: `tictactoe_decline_${challengerId}_${opponent.id}`
            }
          ]
        }
      ]
    });
  }
};
console.log('Exported command object:', module.exports);
