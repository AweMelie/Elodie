// commands/tools/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder }        = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows the bots latency, plus uptime'),

  async execute(interaction) {
    // 1. Calculate latencies
    const messageLatency = Date.now() - interaction.createdTimestamp;
    const apiLatency     = Math.round(interaction.client.ws.ping);

    // 2. Calculate uptime (ms → units)
    const uptimeMs     = interaction.client.uptime;
    const totalSeconds = Math.floor(uptimeMs / 1000);

    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // 3. Build a pretty string with plurals
    const parts = [
      `${days} Day${days !== 1 ? 's' : ''}`,
      `${hours} Hour${hours !== 1 ? 's' : ''}`,
      `${minutes} Min${minutes !== 1 ? 's' : ''}`,
      `${seconds} Sec${seconds !== 1 ? 's' : ''}`
    ];
    const uptime = parts.join(', ');

    // 4. Build the embed
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(0xEDA9AA)
      .addFields(
        {
          name: 'Message Latency',
          value: `\`${messageLatency}ms\``,
          inline: true
        },
        {
          name: 'API Latency',
          value: `\`${apiLatency}ms\``,
          inline: true
        },
        {
          name: 'Uptime',
          value: `\`${uptime}\``,
          inline: false
        }
      )
      .setTimestamp();

    // 5. Reply with the embed
    await interaction.reply({ embeds: [embed] });
  }
};