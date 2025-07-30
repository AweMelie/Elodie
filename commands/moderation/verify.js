// commands/moderation/verify.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const {
  ensureGuildStorage,
  loadConfig
} = require('../../utils/storageManager');
const formatPlaceholders = require('../../utils/formatPlaceholders');
const convertColor       = require('../../utils/convertColor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Assign the verified role to a user.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to verify')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const guild      = interaction.guild;
    const member     = guild.members.cache.get(targetUser.id);

    // 1️⃣ Ensure the target is in the guild
    if (!member) {
      return interaction.reply({
        content: '❌ User not found in this server.',
        flags: 64
      });
    }

    // 2️⃣ Ensure storage and load configs
    ensureGuildStorage(guild.id);
    const config     = loadConfig(guild.id, 'config.json')           || {};
    const events     = loadConfig(guild.id, 'server-events.json')   || {};
    const savedEmbeds= loadConfig(guild.id, 'embeds.json')          || {};

    // 3️⃣ Validate verifiedRole
    const verifiedRoleId = config.verifiedRole;
    if (!verifiedRoleId) {
      return interaction.reply({
        content: '❌ Verified role not set. Use `/verifiedrole` first.',
        flags: 64
      });
    }

    const role = guild.roles.cache.get(verifiedRoleId);
    if (!role) {
      return interaction.reply({
        content: '❌ Verified role not found in this server.',
        flags: 64
      });
    }

    // 4️⃣ Assign the role
    try {
      await member.roles.add(role);
    } catch (err) {
      console.error('Role assign error:', err);
      return interaction.reply({
        content: '❌ Failed to assign the verified role.',
        flags: 64
      });
    }

    // 5️⃣ Build the log embed
    const logEmbed = new EmbedBuilder()
      .setTitle('User Verified')
      .setColor(0x2ECC71)
      .setTimestamp()
      .setDescription([
        `**User:** <@${targetUser.id}>`,
        `**User ID:** \`${targetUser.id}\``,
        `**Moderator:** <@${interaction.user.id}>`
      ].join('\n'));

    // 6️⃣ Send log embed or fallback reply
    const logChannelId = config.logChannel;
    const logChannel   = logChannelId && guild.channels.cache.get(logChannelId);

    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
      await interaction.reply({
        content: `✅ Verified <@${targetUser.id}>. Logged in <#${logChannelId}>.`,
        flags: 64
      });
    } else {
      await interaction.reply({
        content: [
          `✅ Verified <@${targetUser.id}>`,
          '',
          '> Tip: set up a log channel with `/logchannel`'
        ].join('\n'),
        flags: 64
      });
    }

    // 7️⃣ Send configured verify message
    const { verifyChannel, verifyMessage } = events;
    if (verifyChannel && verifyMessage) {
      const sendChannel = guild.channels.cache.get(verifyChannel);
      if (sendChannel) {
        // Extract embed reference
        const embedMatch = verifyMessage.match(/\{embed:([\w-]+)\}/);
        const embedName  = embedMatch?.[1];
        const rawText    = verifyMessage.replace(/\{embed:[\w-]+\}/, '').trim();
        const formattedText = formatPlaceholders(member, guild, rawText);

        // Load and rebuild embed with placeholders
        let attachedEmbed = null;
        if (embedName && savedEmbeds[embedName]) {
          const raw     = savedEmbeds[embedName];
          const base    = {
            title:       null,
            description: null,
            color:       '#5865F2',
            author:      { name: null,   icon_url: null },
            footer:      { text: null,   icon_url: null },
            thumbnail:   { url:  null },
            image:       { url:  null },
            fields:      [],
            timestamp:   false
          };

          // Merge raw into defaults
          const cfg = {
            ...base,
            ...raw,
            author:      { ...base.author,    ...raw.author    },
            footer:      { ...base.footer,    ...raw.footer    },
            thumbnail:   { ...base.thumbnail, ...raw.thumbnail },
            image:       { ...base.image,     ...raw.image     },
            fields:      Array.isArray(raw.fields) ? raw.fields : base.fields
          };

          const eb = new EmbedBuilder();
          const safeColor = convertColor(cfg.color || base.color);
          if (safeColor !== null) eb.setColor(safeColor);

          if (cfg.title) {
            eb.setTitle(formatPlaceholders(member, guild, cfg.title));
          }
          if (cfg.description) {
            eb.setDescription(formatPlaceholders(member, guild, cfg.description));
          }
          if (cfg.fields.length) {
            eb.setFields(
              cfg.fields.map(f => ({
                name:  formatPlaceholders(member, guild, f.name),
                value: formatPlaceholders(member, guild, f.value),
                inline: !!f.inline
              }))
            );
          }
          if (cfg.author.name) {
            eb.setAuthor({
              name:    formatPlaceholders(member, guild, cfg.author.name),
              iconURL: cfg.author.icon_url
            });
          }
          if (cfg.footer.text) {
            eb.setFooter({
              text:    formatPlaceholders(member, guild, cfg.footer.text),
              iconURL: cfg.footer.icon_url
            });
          }
          if (cfg.thumbnail.url) eb.setThumbnail(cfg.thumbnail.url);
          if (cfg.image.url)     eb.setImage(cfg.image.url);
          if (cfg.timestamp)     eb.setTimestamp();

          attachedEmbed = eb;
        }

        await sendChannel.send({
          content: formattedText,
          embeds:  attachedEmbed ? [attachedEmbed] : []
        });
      }
    }
  }
};