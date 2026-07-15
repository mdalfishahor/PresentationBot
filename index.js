// ─── Main Entry Point ─────────────────────────────────────────────────────────
// Bootstraps the entire bot: validates config, initialises the database, creates
// the Discord client, loads events and commands, then logs in.
// ───────────────────────────────────────────────────────────────────────────────

// ─── Load environment variables first (config.js does this) ───────────────────
const { config, validateConfig } = require('./config');
const { Client, GatewayIntentBits } = require('discord.js');
const { initDatabase, closeDatabase } = require('./database/database');
const { loadEvents } = require('./handlers/eventHandler');
const { loadCommands } = require('./handlers/commandHandler');
const { logEvent } = require('./utils/logger');

// ─── Validate required environment variables ──────────────────────────────────
validateConfig();

// ─── Initialise SQLite database ───────────────────────────────────────────────
const dbReady = initDatabase();
if (!dbReady) {
  console.error('❌ Could not initialise the database. Exiting.');
  process.exit(1);
}
console.log('✔ Database initialised.');

// ─── Create the Discord client ────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// ─── Load events and commands ──────────────────────────────────────────────────
loadEvents(client);

// ─── Login & then load commands (post-login so client is ready) ───────────────
client.once('ready', async () => {
  try {
    await loadCommands(client);
  } catch (err) {
    console.error('❌ Failed to load commands after ready:', err.message);
  }
});

// ─── Graceful shutdown handler ────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  closeDatabase();
  client.destroy();
  logEvent('BOT_SHUTDOWN', 'Bot shut down gracefully.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully (SIGTERM)...');
  closeDatabase();
  client.destroy();
  logEvent('BOT_SHUTDOWN', 'Bot shut down via SIGTERM.');
  process.exit(0);
});

// ─── Unhandled rejection handler ──────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
  logEvent('UNHANDLED_REJECTION', reason?.message || String(reason));
});

// ─── Login to Discord ─────────────────────────────────────────────────────────
client.login(config.token)
  .then(() => {
    console.log('⏳ Bot is logging in...');
  })
  .catch((err) => {
    console.error('❌ Failed to login:', err.message);
    closeDatabase();
    process.exit(1);
  });
