// ─── Command Handler ───────────────────────────────────────────────────────────
// Dynamically loads all slash command files from the commands/ directory,
// registers them on the client.commands collection, and deploys them to Discord.
// Also loads button and modal handlers into the client.
// ───────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { config } = require('../config');
const { handleVerifyButton, BUTTON_CUSTOM_ID } = require('../buttons/verifyButton');
const { handleVerificationModal, MODAL_CUSTOM_ID } = require('../modals/verificationModal');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands');

/**
 * Loads all command files, registers them on the client, and deploys them to Discord.
 * Also registers button and modal handlers on the client.
 * @param {import('discord.js').Client} client
 */
async function loadCommands(client) {
  // ── Load command files ───────────────────────────────────────────────────────
  client.commands = new Map();
  const commandFiles = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.js'));
  const slashData = [];

  for (const file of commandFiles) {
    const filePath = path.join(COMMANDS_DIR, file);
    const command = require(filePath);

    if (!command.data || !command.execute) {
      console.warn(`⚠️  Skipping command file "${file}" — missing data or execute().`);
      continue;
    }

    const commandName = command.data.name;
    client.commands.set(commandName, command);
    slashData.push(command.data.toJSON());
    console.log(`  ✅ Loaded command: /${commandName}`);
  }

  console.log(`✔ Loaded ${commandFiles.length} command(s).`);

  // ── Register button handlers on the client ───────────────────────────────────
  client.buttons = new Map();
  client.buttons.set(BUTTON_CUSTOM_ID, handleVerifyButton);

  // ── Register modal handlers on the client ────────────────────────────────────
  client.modals = new Map();
  client.modals.set(MODAL_CUSTOM_ID, handleVerificationModal);

  // ── Deploy slash commands to Discord ─────────────────────────────────────────
  if (!config.token || !config.clientId || !config.guildId) {
    console.warn('⚠️  Missing BOT_TOKEN, CLIENT_ID, or GUILD_ID — skipping command deployment.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log('⏳ Registering slash commands...');
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body: slashData,
    });
    console.log('✔ Slash commands registered successfully.');
  } catch (err) {
    console.error('❌ Failed to register slash commands:', err.message);
  }
}

module.exports = { loadCommands };
