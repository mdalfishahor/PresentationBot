// ─── Guild Member Add Event ───────────────────────────────────────────────────
// Fires when a new user joins the server.
// Currently a placeholder — new users can only see #rules and #verify by default
// via Discord's channel permissions (configured on the server side).
// The verification panel handles the rest.
// ───────────────────────────────────────────────────────────────────────────────

const { logEvent } = require('../utils/logger');

const EVENT_NAME = 'guildMemberAdd';
const once = false;

async function execute(member) {
  // Log the join — no automatic action needed as channel visibility
  // is handled by Discord role/channel permissions.
  logEvent('MEMBER_JOIN', `${member.user.tag} joined ${member.guild.name}`);
  console.log(`👋 ${member.user.tag} joined ${member.guild.name}`);
}

module.exports = { execute, EVENT_NAME, once };
