// utils/isImageUrl.js
module.exports = url =>
  /^(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg))(?:\?\S*)?$/i.test(url) ||
  /^https:\/\/cdn\.discordapp\.com\/attachments\/\d+\/\d+\/\S+$/i.test(url);