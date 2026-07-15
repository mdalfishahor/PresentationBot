// ─── Verify Button Handler ─────────────────────────────────────────────────────
// Handles the "verify" button click — creates and shows the verification modal.
// Runs anti-spam checks first.
// ───────────────────────────────────────────────────────────────────────────────

const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { isBlocked, recordAttempt } = require('../utils/antiSpam');
const { createFailureEmbed } = require('../utils/embedBuilder');
const { config } = require('../config');

const BUTTON_CUSTOM_ID = 'verify';

/**
 * Processes the "verify" button interaction.
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleVerifyButton(interaction) {
  // ── Anti-spam check ──────────────────────────────────────────────────────────
  const { blocked, remainingMs } = isBlocked(interaction.user.id);
  if (blocked) {
    const minutes = Math.ceil(remainingMs / 60000);
    const reply = {
      embeds: [createFailureEmbed(
        `⏳ You are temporarily blocked from verifying.\nPlease try again in **${minutes} minute(s)**.`
      )],
      flags: MessageFlags.Ephemeral,
    };

    // If the interaction hasn't been deferred/replied yet
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
    return;
  }

  // Record the attempt (counts toward the rate limit)
  recordAttempt(interaction.user.id);

  // ── Build the modal ──────────────────────────────────────────────────────────
  const modal = new ModalBuilder()
    .setCustomId('verification_modal')
    .setTitle('🔐 Server Verification');

  // Field 1: Full Name
  const nameInput = new TextInputBuilder()
    .setCustomId('full_name')
    .setLabel('Full Name')
    .setPlaceholder('e.g. Alfi Shahor')
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(100)
    .setRequired(true);

  // Field 2: Student ID (last 3 digits)
  const studentIdInput = new TextInputBuilder()
    .setCustomId('student_id')
    .setLabel('Student ID (last 3 digits)')
    .setPlaceholder('e.g. 123')
    .setStyle(TextInputStyle.Short)
    .setMinLength(3)
    .setMaxLength(3)
    .setRequired(true);

  // Field 3: Course Code
  const courseInput = new TextInputBuilder()
    .setCustomId('course')
    .setLabel('Course Code')
    .setPlaceholder('IBCC, CF, ENG, or MATH101')
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(10)
    .setRequired(true);

  // Build rows (one input per row)
  const row1 = new ActionRowBuilder().addComponents(nameInput);
  const row2 = new ActionRowBuilder().addComponents(studentIdInput);
  const row3 = new ActionRowBuilder().addComponents(courseInput);

  modal.addComponents(row1, row2, row3);

  // ── Show the modal ───────────────────────────────────────────────────────────
  await interaction.showModal(modal);
}

module.exports = { handleVerifyButton, BUTTON_CUSTOM_ID };
