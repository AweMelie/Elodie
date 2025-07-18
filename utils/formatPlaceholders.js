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
 * If given a raw User but a guild is passed, attempts to pull the member
 * from guild.members.cache to get a real displayName.
 */
module.exports = function formatPlaceholders(memberOrUser, guild = {}, template = '') {
  if (!template || typeof template !== 'string') return '';

  // figure out user + displayName
  let user, displayName, joinedAt, createdAt;

  if (memberOrUser.user) {
    // it’s already a GuildMember
    user        = memberOrUser.user;
    displayName = memberOrUser.displayName;
    joinedAt    = memberOrUser.joinedAt;
    createdAt   = user.createdAt;
  } else {
    // raw User – try to fetch a GuildMember for displayName if possible
    user      = memberOrUser;
    createdAt = user.createdAt;

    if (guild.members?.cache?.has(user.id)) {
      const gm = guild.members.cache.get(user.id);
      displayName = gm.displayName;
      joinedAt    = gm.joinedAt;
    } else {
      displayName = user.username;
      joinedAt    = null;
    }
  }

  // safe guild metrics
  const memberCount       = guild.memberCount ?? 0;
  const humanCountNumeric = guild.members?.cache.filter(m => !m.user.bot).size ?? 0;

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
    '{server_humans}'         : humanCountNumeric.toString(),
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