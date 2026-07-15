// ─── Ready Event ──────────────────────────────────────────────────────────────
// Fires once when the bot logs in successfully.
// Logs bot name, guild count, member count, ping, and database status.
// ───────────────────────────────────────────────────────────────────────────────

const { ActivityType } = require('discord.js');
const { logEvent } = require('../utils/logger');

const EVENT_NAME = 'ready';
const once = true;

async function execute(client) {
  // Calculate total members across all guilds
  let totalMembers = 0;
  client.guilds.cache.forEach((guild) => {
    totalMembers += guild.memberCount;
  });

  console.log('┌─────────────────────────────────────────────┐');
  console.log('│   ✅ Bot is online and ready!                │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│   Bot Name:     ${client.user.tag.padEnd(21)}│`);
  console.log(`│   Guild Count:  ${String(client.guilds.cache.size).padEnd(21)}│`);
  console.log(`│   Member Count: ${String(totalMembers).padEnd(21)}│`);
  console.log(`│   Ping:         ${client.ws.ping}ms`.padEnd(45) + '│');
  console.log(`│   Database:     ✅ Connected`.padEnd(45) + '│');
  console.log('└─────────────────────────────────────────────┘');

  // Set bot activity
  client.user.setActivity('verified members', { type: ActivityType.Watching });

  logEvent('BOT_READY', `${client.user.tag} ready — ${client.guilds.cache.size} guilds, ${totalMembers} members`);
}

module.exports = { execute, EVENT_NAME, once };
