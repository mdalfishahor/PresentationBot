// ─── /verified Command ─────────────────────────────────────────────────────────
// Shows the total number of verified users in the server.
// Optionally lists all verified users.
// ───────────────────────────────────────────────────────────────────────────────

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getTotalVerified, getAllUsers } = require('../database/database');

const data = new SlashCommandBuilder()
  .setName('verified')
  .setDescription('Shows total verified users and optionally lists them.')
  .addBooleanOption((option) =>
    option.setName('list')
      .setDescription('Set to true to show all verified users (may be long).')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: '❌ You need **Manage Roles** permission to use this command.', flags: MessageFlags.Ephemeral });
  }

  const showList = interaction.options.getBoolean('list') ?? false;
  const count = getTotalVerified();

  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('📊 Verified Users')
    .setDescription(`Total verified members: **${count}**`)
    .setFooter({ text: 'Presentation Group Verification System' })
    .setTimestamp();

  // If the user requested a full list and there are users
  if (showList && count > 0) {
    const allUsers = getAllUsers();
    const lines = allUsers.map((u, i) => `${i + 1}. **${u.display_name}** — \`${u.student_id}\` (${u.course.toUpperCase()})`);
    // Discord embed field values are limited to 1024 chars; split into multiple fields
    const MAX_LENGTH = 1000;
    let currentChunk = '';
    let fieldIndex = 0;

    for (const line of lines) {
      if ((currentChunk + line + '\n').length > MAX_LENGTH) {
        embed.addFields({ name: `Users (${++fieldIndex})`, value: currentChunk.trimEnd(), inline: false });
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }
    if (currentChunk) {
      embed.addFields({ name: `Users (${++fieldIndex})`, value: currentChunk.trimEnd(), inline: false });
    }
  }

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = { data, execute };
