// utils/convertColor.js

/**
 * Convert a hex color string (e.g. "#FFC0CB") to a Discord-compatible integer.
 * Returns null if invalid.
 */
module.exports = hex => {
  if (!hex || typeof hex !== 'string') return null;

  const cleaned = hex.trim().replace(/^#/, '');

  if (!/^[0-9A-F]{6}$/i.test(cleaned)) return null;

  const int = parseInt(cleaned, 16);
  return isNaN(int) ? null : int;
};