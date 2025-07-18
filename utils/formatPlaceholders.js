// utils/formatPlaceholders.js

/**
 * Returns the ordinal form of a number (e.g., 1 → “1st”).
 */
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Replace placeholders in a template string with user/guild context.
 * Accepts either a GuildMember (with .user) or a raw User object.
 */
module.exports = function formatPlaceholders(memberOrUser, guild = {}, template = '') {
  if (!template || typeof template !== 'string') return '';

  // Normalize to a consistent shape
  let user, displayName, joinedAt, createdAt;
  if (memberOrUser.user) {
    // GuildMember
    user        = memberOrUser.user;
    displayName = memberOrUser.displayName;
    joinedAt    = memberOrUser.joinedAt;
    createdAt   = user.createdAt;
  } else {
    // Raw User
    user        = memberOrUser;
    displayName = user.username;
    joinedAt    = null;
    createdAt   = user.createdAt;
  }

  // Precompute guild metrics safely
  const memberCount        = guild.memberCount ?? 0;
  const humanCount         = (guild.members?.cache.filter(m => !m.user.bot).size) ?? '';
  const humanCountNumeric  = typeof humanCount === 'number' ? humanCount : Number(guild.members?.cache.filter(m => !m.user.bot).size) || 0;

  const replacements = {
    '{user}'                  : memberOrUser.toString(),
    '{user_name}'             : user.username,
    '{user_nick}'             : displayName,
    '{user_id}'               : user.id,
    '{user_joined}'           : joinedAt?.toLocaleString() ?? '',
    '{user_created}'          : createdAt?.toLocaleDateString() ?? '',

    '{server_name}'           : guild.name ?? '',
    '{server_id}'             : guild.id ?? '',
    '{server_members}'        : memberCount.toString(),
    '{server_members_ordinal}': ordinal(memberCount),
    '{server_humans}'         : humanCount.toString(),
    '{server_humans_ordinal}' : ordinal(humanCountNumeric),
    '{server_icon}'           : typeof guild.iconURL === 'function' ? guild.iconURL() : '',
    '{server_create}'         : guild.createdAt?.toLocaleDateString() ?? '',

    '{boost_count}'           : (guild.premiumSubscriptionCount ?? '').toString(),
    '{boost_level}'           : (guild.premiumTier ?? '').toString(),

    '{new_line}'              : '\n'
    // Note: {embed:name} is handled elsewhere
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
};