// ─── Verification Modal Handler ────────────────────────────────────────────────
// Processes the verification modal submission.
// Validates all fields, checks for duplicates, assigns roles, renames the user,
// and logs the result.
// ───────────────────────────────────────────────────────────────────────────────

const { MessageFlags } = require('discord.js');
const { config } = require('../config');
const { insertUser, isStudentIdTaken, getUserByDiscordId } = require('../database/database');
const { createSuccessEmbed, createFailureEmbed, createLogSuccessEmbed, createLogFailureEmbed } = require('../utils/embedBuilder');
const { logSuccess, logFailure } = require('../utils/logger');

const MODAL_CUSTOM_ID = 'verification_modal';

/**
 * Validates that a value is a comma or space-separated string of exactly 3 digits.
 * Accepts "123", " 455 ", "9 9 9", etc. — strips all non-digits and checks length.
 * @param {string} raw
 * @returns {{ valid: boolean, clean: string, reason: string }}
 */
function validateStudentId(raw) {
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length !== 3) {
    return { valid: false, clean: digitsOnly, reason: 'Student ID must be exactly 3 digits (0–9).' };
  }
  return { valid: true, clean: digitsOnly, reason: '' };
}

/**
 * Validates the course code against allowed values (case-insensitive).
 * @param {string} raw
 * @returns {{ valid: boolean, clean: string, reason: string }}
 */
function validateCourse(raw) {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (!config.allowedCourses.includes(lower)) {
    return {
      valid: false,
      clean: trimmed,
      reason: `Invalid course code.\nAccepted: ${config.allowedCourses.map((c) => c.toUpperCase()).join(', ')}`,
    };
  }
  return { valid: true, clean: lower, reason: '' };
}

/**
 * Processes the modal submission.
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleVerificationModal(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const { member, guild, user } = interaction;
  const guildMember = member || (await guild.members.fetch(user.id).catch(() => null));

  if (!guildMember) {
    await interaction.editReply({ embeds: [createFailureEmbed('Could not find your member data in this server.')] });
    return;
  }

  // ── Extract fields ───────────────────────────────────────────────────────────
  const fullName = interaction.fields.getTextInputValue('full_name').trim();
  const rawStudentId = interaction.fields.getTextInputValue('student_id');
  const rawCourse = interaction.fields.getTextInputValue('course');

  // ── Validate student ID ──────────────────────────────────────────────────────
  const idResult = validateStudentId(rawStudentId);
  if (!idResult.valid) {
    await interaction.editReply({ embeds: [createFailureEmbed(idResult.reason)] });
    logFailure(user.id, user.tag, 'Invalid student ID', rawStudentId);
    await sendFailLog(guild, user.tag, user.id, 'Invalid student ID', `Input: "${rawStudentId}"`);
    return;
  }

  // ── Validate course ──────────────────────────────────────────────────────────
  const courseResult = validateCourse(rawCourse);
  if (!courseResult.valid) {
    await interaction.editReply({ embeds: [createFailureEmbed(courseResult.reason)] });
    logFailure(user.id, user.tag, 'Invalid course code', rawCourse);
    await sendFailLog(guild, user.tag, user.id, 'Invalid course code', `Input: "${rawCourse}"`);
    return;
  }

  // ── Check for duplicate student ID in database ───────────────────────────────
  if (isStudentIdTaken(idResult.clean)) {
    await interaction.editReply({
      embeds: [createFailureEmbed('❌ This Student ID is **already registered**.\nIf you believe this is a mistake, please contact an admin.')],
    });
    logFailure(user.id, user.tag, 'Duplicate student ID', idResult.clean);
    await sendFailLog(guild, user.tag, user.id, 'Duplicate student ID', `ID: ${idResult.clean}`);
    return;
  }

  // ── Check if user already verified ───────────────────────────────────────────
  if (getUserByDiscordId(user.id)) {
    await interaction.editReply({
      embeds: [createFailureEmbed('You are **already verified** in this server.')],
    });
    return;
  }

  // ── All checks passed — proceed ──────────────────────────────────────────────
  try {
    // 1. Insert into database
    insertUser(user.id, user.tag, fullName, idResult.clean, courseResult.clean);

    // 2. Assign "Verified" role
    if (config.verifiedRoleId) {
      await guildMember.roles.add(config.verifiedRoleId).catch((err) => {
        console.warn(`⚠️  Could not assign verified role to ${user.tag}: ${err.message}`);
      });
    }

    // 3. Assign course role
    const courseRoleId = config.getRoleIdForCourse(courseResult.clean);
    if (courseRoleId) {
      await guildMember.roles.add(courseRoleId).catch((err) => {
        console.warn(`⚠️  Could not assign course role to ${user.tag}: ${err.message}`);
      });
    }

    // 4. Rename nickname: "Name | 123"
    const nickname = `${fullName} | ${idResult.clean}`;
    await guildMember.setNickname(nickname).catch((err) => {
      console.warn(`⚠️  Could not set nickname for ${user.tag}: ${err.message}`);
    });

    // 5. Reply with success
    await interaction.editReply({
      embeds: [createSuccessEmbed(fullName, idResult.clean, courseResult.clean)],
    });

    // 6. Log success
    logSuccess(user.id, user.tag, idResult.clean, courseResult.clean);
    await sendSuccessLog(guild, user, idResult.clean, courseResult.clean, fullName);

  } catch (err) {
    console.error('❌ Verification error:', err);
    await interaction.editReply({
      embeds: [createFailureEmbed('An unexpected error occurred. Please contact an admin.')],
    }).catch(() => {});
  }
}

// ─── Helper: send a success embed to the log channel ──────────────────────────
async function sendSuccessLog(guild, user, studentId, course, displayName) {
  if (!config.logChannelId) return;
  const channel = guild.channels.cache.get(config.logChannelId);
  if (!channel) return;

  const member = guild.members.cache.get(user.id);
  const logEntry = {
    discord_id: user.id,
    username: user.tag,
    student_id: studentId,
    course: course,
    verified_at: new Date().toISOString().replace('T', ' ').split('.')[0],
  };

  await channel.send({ embeds: [createLogSuccessEmbed(logEntry, member)] }).catch(() => {});
}

// ─── Helper: send a failure embed to the log channel ──────────────────────────
async function sendFailLog(guild, username, discordId, reason, detail = '') {
  if (!config.logChannelId) return;
  const channel = guild.channels.cache.get(config.logChannelId);
  if (!channel) return;

  await channel.send({ embeds: [createLogFailureEmbed(username, discordId, reason, detail)] }).catch(() => {});
}

module.exports = { handleVerificationModal, MODAL_CUSTOM_ID };
