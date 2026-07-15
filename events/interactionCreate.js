// ─── Interaction Create Event ─────────────────────────────────────────────────
// Central event handler for all interactions (slash commands, buttons, modals).
// Routes each interaction to the appropriate handler based on type and customId.
// ───────────────────────────────────────────────────────────────────────────────

const { MessageFlags } = require('discord.js');
const { logEvent } = require('../utils/logger');
const { createFailureEmbed } = require('../utils/embedBuilder');

const EVENT_NAME = 'interactionCreate';
const once = false;

async function execute(interaction, client) {
  try {
    // ── Slash Commands ─────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({
          content: '❌ Unknown command.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await command.execute(interaction);
      return;
    }

    // ── Button Interactions ────────────────────────────────────────────────────
    if (interaction.isButton()) {
      const buttonHandler = client.buttons.get(interaction.customId);
      if (buttonHandler) {
        await buttonHandler(interaction);
      } else {
        await interaction.reply({ content: '❌ Unknown button.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    // ── Modal Submit Interactions ──────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const modalHandler = client.modals.get(interaction.customId);
      if (modalHandler) {
        await modalHandler(interaction);
      } else {
        await interaction.reply({ content: '❌ Unknown modal submission.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

  } catch (err) {
    console.error('❌ Unhandled interaction error:', err);
    logEvent('INTERACTION_ERROR', `${interaction.user?.tag} — ${err.message}`);

    // Attempt to reply with a generic error message
    const errorReply = {
      embeds: [createFailureEmbed('An unexpected error occurred. Please try again or contact an admin.')],
      flags: MessageFlags.Ephemeral,
    };

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorReply);
      } else {
        await interaction.reply(errorReply);
      }
    } catch (_) {
      // Interaction may have already been replied to or timed out — swallow the error
    }
  }
}

module.exports = { execute, EVENT_NAME, once };
