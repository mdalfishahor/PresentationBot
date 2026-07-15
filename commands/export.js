// ─── /export Command ───────────────────────────────────────────────────────────
// Exports the SQLite database to a CSV file and sends it as an attachment.
// The CSV includes all verified user records.
// ───────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const os = require('os');
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getAllUsers } = require('../database/database');
const { createFailureEmbed } = require('../utils/embedBuilder');

const data = new SlashCommandBuilder()
  .setName('export')
  .setDescription('Exports all verified user data to a CSV file.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const users = getAllUsers();

    if (users.length === 0) {
      return interaction.editReply({ embeds: [createFailureEmbed('No verified users to export.')] });
    }

    // Build CSV content
    const headers = ['Discord ID', 'Username', 'Display Name', 'Student ID', 'Course', 'Verified At'];
    const rows = users.map((u) => [
      escapeCsvField(u.discord_id),
      escapeCsvField(u.username),
      escapeCsvField(u.display_name),
      escapeCsvField(u.student_id),
      escapeCsvField(u.course),
      escapeCsvField(u.verified_at),
    ]);

    const csvLines = [headers.join(','), ...rows.map((r) => r.join(','))];
    const csvContent = '\uFEFF' + csvLines.join('\r\n'); // BOM for Excel UTF-8 compatibility

    // Write to a temp file
    const tempFile = path.join(os.tmpdir(), `verification_export_${Date.now()}.csv`);
    fs.writeFileSync(tempFile, csvContent, 'utf-8');

    await interaction.editReply({
      content: `📁 Exported **${users.length}** record(s).`,
      files: [tempFile],
    });

    // Clean up after sending
    fs.unlink(tempFile, (err) => {
      if (err) console.warn('⚠️  Could not delete temp CSV:', err.message);
    });
  } catch (err) {
    console.error('❌ Export error:', err);
    await interaction.editReply({ embeds: [createFailureEmbed('Failed to export data.')] });
  }
}

/**
 * Escapes a CSV field — wraps in quotes if it contains commas, quotes, or newlines.
 * Doubles any internal quotes.
 */
function escapeCsvField(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = { data, execute };
