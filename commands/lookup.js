// ─── /lookup Command ──────────────────────────────────────────────────────────
// Looks up a verified user by their student ID (last 3 digits) and shows details.
// ───────────────────────────────────────────────────────────────────────────────

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getUserByStudentId } = require('../database/database');

const data = new SlashCommandBuilder()
  .setName('lookup')
  .setDescription('Looks up a verified user by their student ID (last 3 digits).')
  .addStringOption((option) =>
    option.setName('studentid')
      .setDescription('The last 3 digits of the student ID (e.g. 123)')
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(3)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: '❌ You need **Manage Roles** permission to use this command.', flags: MessageFlags.Ephemeral });
  }

  const rawId = interaction.options.getString('studentid');
  const digitsOnly = rawId.replace(/\D/g, '');

  if (digitsOnly.length !== 3) {
    return interaction.reply({ content: '❌ Please provide exactly 3 digits for the student ID.', flags: MessageFlags.Ephemeral });
  }

  const user = getUserByStudentId(digitsOnly);
  if (!user) {
    return interaction.reply({ content: `❌ No user found with student ID **${digitsOnly}**.`, flags: MessageFlags.Ephemeral });
  }

  const embed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle('🔍 User Lookup Result')
    .addFields(
      { name: '👤 Name', value: user.display_name || user.username, inline: false },
      { name: '💬 Discord User', value: user.username, inline: true },
      { name: '📚 Course', value: user.course.toUpperCase(), inline: true },
      { name: '📛 Student ID', value: user.student_id, inline: true },
      { name: '📅 Verification Date', value: user.verified_at, inline: false }
    )
    .setFooter({ text: 'Presentation Group Verification System' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = { data, execute };
