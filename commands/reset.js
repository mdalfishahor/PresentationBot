// ─── /reset Command ────────────────────────────────────────────────────────────
// Removes a user's verification: deletes the database record, removes roles,
// resets the nickname, and clears the anti-spam state so they can re-verify.
// ───────────────────────────────────────────────────────────────────────────────

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { config } = require('../config');
const { deleteUser, getUserByDiscordId } = require('../database/database');
const { resetUser: resetAntiSpam } = require('../utils/antiSpam');
const { createSuccessEmbed, createFailureEmbed } = require('../utils/embedBuilder');
const { logEvent } = require('../utils/logger');

const data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Removes a user\'s verification so they can re-verify.')
  .addUserOption((option) =>
    option.setName('user')
      .setDescription('The verified user to reset.')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options.getUser('user');
  const targetMember = interaction.guild.members.cache.get(targetUser.id);

  // Check if user exists in the database
  const record = getUserByDiscordId(targetUser.id);
  if (!record) {
    return interaction.editReply({
      embeds: [createFailureEmbed(`❌ **${targetUser.tag}** is not verified or not in the database.`)],
    });
  }

  try {
    // 1. Delete database record
    deleteUser(targetUser.id);

    // 2. Remove verified role
    if (config.verifiedRoleId && targetMember) {
      await targetMember.roles.remove(config.verifiedRoleId).catch((err) => {
        console.warn(`⚠️  Could not remove verified role from ${targetUser.tag}: ${err.message}`);
      });
    }

    // 3. Remove course role
    const courseRoleId = config.getRoleIdForCourse(record.course);
    if (courseRoleId && targetMember) {
      await targetMember.roles.remove(courseRoleId).catch((err) => {
        console.warn(`⚠️  Could not remove course role from ${targetUser.tag}: ${err.message}`);
      });
    }

    // 4. Reset nickname
    if (targetMember) {
      await targetMember.setNickname(null).catch((err) => {
        console.warn(`⚠️  Could not reset nickname for ${targetUser.tag}: ${err.message}`);
      });
    }

    // 5. Clear anti-spam state
    resetAntiSpam(targetUser.id);

    logEvent('RESET', `Admin ${interaction.user.tag} reset ${targetUser.tag} (${targetUser.id})`);

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        `🔄 **${targetUser.tag}** has been reset.\nThey can now re-verify using the panel.`,
        '',
        ''
      )],
    });
  } catch (err) {
    console.error('❌ Reset error:', err);
    await interaction.editReply({
      embeds: [createFailureEmbed('An unexpected error occurred while resetting the user.')],
    });
  }
}

module.exports = { data, execute };
