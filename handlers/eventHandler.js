// ─── Event Handler ─────────────────────────────────────────────────────────────
// Dynamically loads all event files from the events/ directory and registers them
// on the Discord client. Any file in events/ that exports execute, EVENT_NAME,
// and optionally once is automatically picked up.
// ───────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', 'events');

/**
 * Loads and registers all event files on the client.
 * @param {import('discord.js').Client} client
 */
function loadEvents(client) {
  const eventFiles = fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(EVENTS_DIR, file);
    const eventModule = require(filePath);

    if (!eventModule.execute || !eventModule.EVENT_NAME) {
      console.warn(`⚠️  Skipping event file "${file}" — missing execute() or EVENT_NAME.`);
      continue;
    }

    const { EVENT_NAME, once, execute } = eventModule;

    if (once) {
      client.once(EVENT_NAME, (...args) => execute(...args, client));
    } else {
      client.on(EVENT_NAME, (...args) => execute(...args, client));
    }

    console.log(`  ✅ Loaded event: ${EVENT_NAME}`);
  }

  console.log(`✔ Loaded ${eventFiles.length} event(s).`);
}

module.exports = { loadEvents };
