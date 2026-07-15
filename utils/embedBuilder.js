// ─── Embed Builder Utility ─────────────────────────────────────────────────────
// Helper functions that create consistent, professional embeds across the bot.
// Colours: 0x2ECC71 (green success), 0xE74C3C (red failure), 0xF1C40F (yellow warning).
// ───────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder } = require('discord.js');

const COLORS = {
  SUCCESS: 0x2ECC71,
  FAILURE: 0xE74C3C,
  WARNING: 0xF1C40F,
  INFO: 0x3498DB,
};

/**
 * Creates the main verification embed posted in #verify.
 */
function createVerificationEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('📋 Welcome to the Presentation Group Server')
    .setDescription(
      'Before you can access the rest of the server, you need to **verify your identity**.\n\n' +
      'Click the **Verify** button below and fill in your details.\n\n' +
      '✅ **What you need:**\n' +
      '• Your full name\n' +
      '• Last **3 digits** of your Student ID\n' +
      '• Your course code\n\n' +
      '⏳ This only takes a minute!'
    )
    .addFields(
      { name: 'Accepted Course Codes', value: '`IBCC` • `CF` • `ENG` • `MATH101`', inline: false }
    )
    .setFooter({ text: 'Presentation Group Verification System' })
    .setTimestamp();
}

/**
 * Success embed for verification.
 */
function createSuccessEmbed(username, studentId, course) {
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ Verification Successful')
    .setDescription(`Welcome **${username}**! You now have full access to the server.`)
    .addFields(
      { name: '📛 Student ID (last 3)', value: studentId, inline: true },
      { name: '📚 Course', value: course.toUpperCase(), inline: true }
    )
    .setFooter({ text: 'Presentation Group Verification System' })
    .setTimestamp();
}

/**
 * Failure embed for verification errors.
 */
function createFailureEmbed(reason) {
  return new EmbedBuilder()
    .setColor(COLORS.FAILURE)
    .setTitle('❌ Verification Failed')
    .setDescription(reason)
    .setFooter({ text: 'Presentation Group Verification System' })
    .setTimestamp();
}

/**
 * Warning embed for soft errors.
 */
function createWarningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Generates a log embed for successful verification (posted in #verification-log).
 */
function createLogSuccessEmbed(user, member) {
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ Verification Successful')
    .setThumbnail(member?.user?.displayAvatarURL() || null)
    .addFields(
      { name: '👤 User', value: `${user.username}${member ? ` (<@${member.id}>)` : ''}`, inline: false },
      { name: '🆔 Discord ID', value: user.discord_id, inline: true },
      { name: '🎫 Student ID', value: user.student_id, inline: true },
      { name: '📚 Course', value: user.course.toUpperCase(), inline: true },
      { name: '📅 Verified At', value: user.verified_at, inline: false }
    )
    .setFooter({ text: 'Presentation Group Verification System' })
    .setTimestamp();
}

/**
 * Generates a log embed for failed verification (posted in #verification-log).
 */
function createLogFailureEmbed(username, discordId, reason, detail = '') {
  const fields = [
    { name: '👤 User', value: username, inline: false },
    { name: '🆔 Discord ID', value: discordId, inline: true },
    { name: '❌ Reason', value: reason, inline: true },
  ];
  if (detail) fields.push({ name: '📝 Details', value: detail, inline: false });

  return new EmbedBuilder()
    .setColor(COLORS.FAILURE)
    .setTitle('❌ Verification Attempt Failed')
    .addFields(fields)
    .setFooter({ text: 'Presentation Group Verification System' })
    .setTimestamp();
}

module.exports = {
  COLORS,
  createVerificationEmbed,
  createSuccessEmbed,
  createFailureEmbed,
  createWarningEmbed,
  createLogSuccessEmbed,
  createLogFailureEmbed,
};
