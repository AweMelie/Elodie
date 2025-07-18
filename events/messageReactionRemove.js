const { loadReactionRoles } = require('../../utils/storageManager');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    const message   = reaction.message;
    const guild     = message.guild;
    if (!guild) return;

    const messageId = message.id;
    const mappings  = loadReactionRoles(guild.id)[messageId];
    if (!mappings) return;

    const match = mappings.find(m => m.emoji === reaction.emoji.toString());
    if (!match) return;

    const member = await guild.members.fetch(user.id);
    await member.roles.remove(match.roleId).catch(() => null);
  }
};