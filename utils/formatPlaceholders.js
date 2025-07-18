function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = function formatPlaceholders(member, guild, template = '') {
  if (!template || typeof template !== 'string') return '';

  const user = member.user;

  const replacements = {
    '{user}': member.toString(),
    '{user_name}': user.username,
    '{user_nick}': member.displayName,
    '{user_id}': user.id,
    '{user_joined}': member.joinedAt?.toLocaleString() ?? '',
    '{user_created}': user.createdAt?.toLocaleDateString() ?? '',

    '{server_name}': guild.name,
    '{server_id}': guild.id,
    '{server_members}': guild.memberCount?.toString() ?? '',
    '{server_members_ordinal}': ordinal(guild.memberCount ?? 0),
    '{server_humans}': guild.members.cache.filter(m => !m.user.bot).size.toString(),
    '{server_humans_ordinal}': ordinal(guild.members.cache.filter(m => !m.user.bot).size),
    '{server_icon}': guild.iconURL(),
    '{server_create}': guild.createdAt?.toLocaleDateString() ?? '',

    '{boost_count}': guild.premiumSubscriptionCount?.toString() ?? '',
    '{boost_level}': guild.premiumTier?.toString() ?? '',

    '{new_line}': '\n'
    // Note: {embed:name} is handled elsewhere
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }

  return result;
};
