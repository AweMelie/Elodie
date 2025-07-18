const fs = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '..', 'storage', 'reactionRoles.json');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    // ignore bots
    if (user.bot) return;

    // ensure cache if partial
    if (reaction.partial) await reaction.fetch();

    const msgId = reaction.message.id;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const mappings = config[msgId];
    if (!mappings) return;

    // find mapping for this emoji
    const map = mappings.find(m => m.emoji === reaction.emoji.toString());
    if (!map) return;

    // assign role
    const member = await reaction.message.guild.members.fetch(user.id);
    await member.roles.add(map.roleId).catch(() => null);
  }
};