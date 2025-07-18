require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  REST,
  Routes,
  Collection,
  GatewayIntentBits,
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const { ensureGuildStorage, removeGuildStorage } = require('./utils/storageManager');
const formatPlaceholders = require('./utils/formatPlaceholders');

function isImageUrl(url) {
  return /^(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg))(?:\?\S*)?$/i.test(url)
    || /^https:\/\/cdn\.discordapp\.com\/attachments\/\d+\/\d+\/\S+$/i.test(url);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] The command at ./${folder}/${file} is missing "data" or "execute".`);
    }
  }
}
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  // ensure a storage folder exists for every guild
  client.guilds.cache.forEach(guild => 
    ensureGuildStorage(guild.id)
  );
});
process.on('unhandledRejection', error => {
  if (
    error.code === 40060 ||
    error.code === 10062 ||
    error.message?.includes('Interaction has already been acknowledged')
  ) {
    console.warn('⚠️ Autocomplete interaction issue silently ignored.');
    return;
  }

  console.error('🔥 Unhandled rejection:', error);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isAutocomplete()) {
    try {
      const focused = interaction.options.getFocused(true);
      const guildId = interaction.guild?.id;
      const embedPath = path.join(__dirname, 'bot-storage', guildId, 'embeds.json');

      let results = [];

      if (fs.existsSync(embedPath)) {
        const embeds = JSON.parse(fs.readFileSync(embedPath));
        const matched = Object.keys(embeds)
          .filter(name => name.toLowerCase().includes(focused.value.toLowerCase()))
          .slice(0, 25)
          .map(name => ({ name, value: name }));

        results = matched;
      }

      await interaction.respond(results);
    } catch (err) {
      if (err.code === 40060 || err.code === 10062) {
        console.warn('⚠️ Autocomplete interaction expired or already responded.');
      } else {
        console.error('❌ Autocomplete failure:', err);
      }
    }

    return;
  }

  if (interaction.isChatInputCommand()) {
    // ── DEBUG LOGS ──
    console.log('▶️ Received command:', interaction.commandName);
    console.log(
      '🔑 Loaded commands:',
      [...client.commands.keys()].join(', ')
    );

    try {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`❌ No handler for ${interaction.commandName}`);
        return interaction.reply({
          content: 'Command not found.',
          flags: 64
        });
      }

      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Error running /${interaction.commandName}:`, error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: 'Something went wrong.',
          flags: 64
        });
      }
    }
  }
  if (interaction.isButton()) {
   const [action, embedName] = interaction.customId.split(':');
   const guildId = interaction.guild.id;
   const embedPath = path.join(__dirname, 'bot-storage', guildId, 'embeds.json');

   let embed = new EmbedBuilder();
   if (fs.existsSync(embedPath)) {
      const embeds = JSON.parse(fs.readFileSync(embedPath));
      const embedData = embeds[embedName];
      if (embedData) embed = EmbedBuilder.from(embedData);
    }

    const modal = new ModalBuilder()
      .setCustomId(`${action}:${embedName}`)
      .setTitle(`Editing ${embedName}`);

    if (action === 'edit_basics') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(embed.data.title ?? ''))
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(String(embed.data.description ?? ''))
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Color Code (e.g. #FFC0CB)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(embed.data.color ?? ''))
        )
      );
    }

    if (action === 'edit_author') {
      const author = embed.data.author || {};
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('author_text')
            .setLabel('Author Text')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(author.name ?? ''))
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('author_image')
            .setLabel('Author Image URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(author.icon_url ?? ''))
        )
      );
    }

    if (action === 'edit_footer') {
      const footer = embed.data.footer || {};
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('footer_text')
            .setLabel('Footer Text')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(footer.text ?? ''))
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('footer_image')
            .setLabel('Footer Image URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(footer.icon_url ?? ''))
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('timestamp')
            .setLabel('Timestamp (Yes/No)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(embed.data.timestamp ? 'Yes' : '')
        )
      );
    }

    if (action === 'edit_images') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('main_image')
            .setLabel('Main Image URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(embed.data.image?.url ?? ''))
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('thumbnail')
            .setLabel('Thumbnail URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(String(embed.data.thumbnail?.url ?? ''))
        )
      );
    }

    return interaction.showModal(modal);
  }
  if (interaction.isModalSubmit()) {
    const [modalType, embedName] = interaction.customId.split(':');
    const guildId   = interaction.guild.id;
    const embedPath = path.join(__dirname, 'bot-storage', guildId, 'embeds.json');
    const trackPath = path.join(__dirname, 'bot-storage', guildId, 'embed-messages.json');

    if (!fs.existsSync(embedPath)) {
      return interaction.reply({ content: 'Embed not found.', flags: 64 });
    }

    const file      = JSON.parse(fs.readFileSync(embedPath));
    const embedData = file[embedName];
    if (!embedData) {
      return interaction.reply({ content: 'Embed name not found.', flags: 64 });
    }

    if (modalType === 'edit_basics') {
      const title       = interaction.fields.getTextInputValue('title').trim();
      const description = interaction.fields.getTextInputValue('description').trim();
      const colorInput  = interaction.fields.getTextInputValue('color').trim();

      if (title       !== '') embedData.title       = title;
      if (description !== '') embedData.description = description;
      if (colorInput && /^#?[0-9A-F]{6}$/i.test(colorInput)) {
        embedData.color = colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
      }
    }

    if (modalType === 'edit_author') {
      const name    = interaction.fields.getTextInputValue('author_text').trim();
      const iconUrl = interaction.fields.getTextInputValue('author_image').trim();

      if (iconUrl && !isImageUrl(iconUrl)) {
        return interaction.reply({
          content: '❌ “Author Image” must be a valid image URL (png, jpg, gif, webp, svg).',
          flags: 64
        });
      }

      embedData.author = { name: name || '', icon_url: iconUrl || null };
    }

    if (modalType === 'edit_footer') {
      const text      = interaction.fields.getTextInputValue('footer_text').trim();
      const iconUrl   = interaction.fields.getTextInputValue('footer_image').trim();
      const timestamp = interaction.fields.getTextInputValue('timestamp').trim().toLowerCase();

      if (iconUrl && !isImageUrl(iconUrl)) {
        return interaction.reply({
          content: '❌ “Footer Image” must be a valid image URL (png, jpg, gif, webp, svg).',
          flags: 64
        });
      }

      embedData.footer    = { text: text || '', icon_url: iconUrl || null };
      embedData.timestamp = timestamp === 'yes';
    }

    if (modalType === 'edit_images') {
      const mainUrl = interaction.fields.getTextInputValue('main_image').trim();
      const thumb   = interaction.fields.getTextInputValue('thumbnail').trim();

      if (mainUrl && !isImageUrl(mainUrl)) {
        return interaction.reply({
          content: '❌ “Main Image” must be a valid image URL (png, jpg, gif, webp, svg).',
          flags: 64
        });
      }
      if (thumb && !isImageUrl(thumb)) {
        return interaction.reply({
          content: '❌ “Thumbnail” must be a valid image URL (png, jpg, gif, webp, svg).',
          flags: 64
        });
      }

      embedData.image     = { url: mainUrl || null };
      embedData.thumbnail = { url: thumb   || null };
    }

    file[embedName] = embedData;
    fs.writeFileSync(embedPath, JSON.stringify(file, null, 2));

    const preview = new EmbedBuilder();
    if (embedData.title) {
      preview.setTitle(
        formatPlaceholders(interaction.member, interaction.guild, embedData.title)
      );
    }
    if (embedData.description) {
      preview.setDescription(
        formatPlaceholders(interaction.member, interaction.guild, embedData.description)
      );
    }
    if (embedData.color) {
      preview.setColor(embedData.color);
    }
    if (Array.isArray(embedData.fields) && embedData.fields.length) {
      preview.setFields(
        embedData.fields.map(f => ({
          name  : formatPlaceholders(interaction.member, interaction.guild, f.name),
          value : formatPlaceholders(interaction.member, interaction.guild, f.value),
          inline: !!f.inline
        }))
      );
    }
    if (embedData.author?.name) {
      preview.setAuthor({
        name    : formatPlaceholders(interaction.member, interaction.guild, embedData.author.name),
        iconURL : embedData.author.icon_url || undefined
      });
    }
    if (embedData.footer?.text) {
      preview.setFooter({
        text    : formatPlaceholders(interaction.member, interaction.guild, embedData.footer.text),
        iconURL : embedData.footer.icon_url || undefined
      });
    }
    if (embedData.timestamp) {
      preview.setTimestamp();
    }
    if (embedData.image?.url) {
      preview.setImage(embedData.image.url);
    }
    if (embedData.thumbnail?.url) {
      preview.setThumbnail(embedData.thumbnail.url);
    }

    const tracker  = fs.existsSync(trackPath)
      ? JSON.parse(fs.readFileSync(trackPath))
      : {};
    const location = tracker[embedName];
    if (location) {
      try {
        const channel = await interaction.client.channels.fetch(location.channelId);
        const message = await channel.messages.fetch(location.messageId);
        await message.edit({ embeds: [preview] });
      } catch (err) {
        if (err.code === 10008) {
          console.warn(`Tracked message for "${embedName}" was deleted.`);
        } else {
          console.error(`Failed to update tracked message:`, err);
        }
      }
    }

    return interaction.reply({
      content: 'Embed updated successfully!',
      flags  : 64
    });
  }
});
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const configPath = path.join(__dirname, 'bot-storage', message.guild.id, 'config.json');
  const countPath = path.join(__dirname, 'bot-storage', message.guild.id, 'count.json');
  if (!fs.existsSync(configPath)) return;

  const config = JSON.parse(fs.readFileSync(configPath));
  const countChannelId = config.countChannel;
  if (!countChannelId || message.channel.id !== countChannelId) return;

  let countData = { lastNumber: 0, lastUserId: null };
  if (fs.existsSync(countPath)) {
    countData = JSON.parse(fs.readFileSync(countPath));
  }

  const content = message.content.trim();
  const number = parseInt(content);
  if (isNaN(number) || number !== countData.lastNumber + 1) {
    await message.react('🥀');
    await message.channel.send(`🥀 <@${message.author.id}> counted incorrectly. The count has been reset.`);
    countData.lastNumber = 0;
    countData.lastUserId = null;
    fs.writeFileSync(countPath, JSON.stringify(countData, null, 2));
    return;
  }

  if (message.author.id === countData.lastUserId) {
    await message.react('🥀');
    await message.channel.send(`🥀 <@${message.author.id}> you can't count twice in a row!`);
    return;
  }

  countData.lastNumber = number;
  countData.lastUserId = message.author.id;
  fs.writeFileSync(countPath, JSON.stringify(countData, null, 2));
  await message.react('🌸');
});

console.log('🔄 Starting bot...');
client.login(process.env.TOKEN);
