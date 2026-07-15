// ─── /verify-panel Command ─────────────────────────────────────────────────────
// Posts the verification embed with the "Verify" button into the configured
// #verify channel. Usable by admins only.
// ───────────────────────────────────────────────────────────────────────────────

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { config } = require('../config');
const { createVerificationEmbed } = require('../utils/embedBuilder');

const data = new SlashCommandBuilder()
  .setName('verify-panel')
  .setDescription('Posts the verification embed in the #verify channel.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction) {
  // Only allow admins to use this
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '❌ You need **Administrator** permissions to use this command.', flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const channelId = config.verifyChannelId;
  if (!channelId) {
    return interaction.editReply({ content: '❌ `VERIFY_CHANNEL_ID` is not set in your .env file.' });
  }

  const channel = interaction.guild.channels.cache.get(channelId);
  if (!channel) {
    return interaction.editReply({ content: '❌ Could not find the verify channel. Check `VERIFY_CHANNEL_ID`.' });
  }

  // Build the button
  const button = new ButtonBuilder()
    .setCustomId('verify')
    .setLabel('Verify')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  // Send the embed + button
  await channel.send({
    embeds: [createVerificationEmbed()],
    components: [row],
  });

  await interaction.editReply({ content: `✅ Verification panel posted in <#${channelId}>.` });
}

module.exports = { data, execute };
