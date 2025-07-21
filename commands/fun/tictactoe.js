const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const renderTictactoeContainer = require('../../utils/containers/renderTictactoeContainer');

const activeGames = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Challenge someone to Tic Tac Toe!')
    .addUserOption(option =>
      option
        .setName('opponent')
        .setDescription('Who do you want to challenge?')
        .setRequired(true)
    ),

  async execute(interaction) {
    const challengerId = interaction.user.id;
    const opponent = interaction.options.getUser('opponent');

    if (opponent.id === challengerId) {
      return interaction.reply({
        content: "You can’t challenge yourself 🥲",
        ephemeral: true
      });
    }

    // Challenge message
    await interaction.reply({
      content: `<@${opponent.id}>, <@${challengerId}> has challenged you to Tic Tac Toe! Do you accept?`,
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
