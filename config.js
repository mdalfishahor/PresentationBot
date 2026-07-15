// ─── Configuration ─────────────────────────────────────────────────────────────
// Loads environment variables from .env and exports them as a single config object.
// Every other module imports from here instead of reading process.env directly.
// ───────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const config = {
  // ── Discord ──────────────────────────────────────────────────────────────────
  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  // ── Role IDs ─────────────────────────────────────────────────────────────────
  verifiedRoleId: process.env.VERIFIED_ROLE_ID,
  ibccRoleId: process.env.IBCC_ROLE_ID,
  cfRoleId: process.env.CF_ROLE_ID,
  engRoleId: process.env.ENG_ROLE_ID,
  math101RoleId: process.env.MATH101_ROLE_ID,

  // ── Channel IDs ──────────────────────────────────────────────────────────────
  verifyChannelId: process.env.VERIFY_CHANNEL_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,

  // ── Anti-spam limits ─────────────────────────────────────────────────────────
  maxAttempts: 5,
  attemptWindowMs: 10 * 60 * 1000,   // 10 minutes
  blockDurationMs: 10 * 60 * 1000,   // 10 minutes

  // ── Allowed course codes (lowercase for case-insensitive matching) ───────────
  allowedCourses: ['ibcc', 'cf', 'eng', 'math101'],

  /**
   * Returns the role ID for a given course code string.
   * @param {string} courseCode - Lowercase course code (e.g. "ibcc")
   * @returns {string|null} Role ID or null if not found
   */
  getRoleIdForCourse(courseCode) {
    const map = {
      ibcc: this.ibccRoleId,
      cf: this.cfRoleId,
      eng: this.engRoleId,
      math101: this.math101RoleId,
    };
    return map[courseCode.toLowerCase()] ?? null;
  },
};

// Validate that all critical values exist early (called from index.js)
function validateConfig() {
  const required = [
    ['BOT_TOKEN', config.token],
    ['CLIENT_ID', config.clientId],
    ['GUILD_ID', config.guildId],
    ['VERIFIED_ROLE_ID', config.verifiedRoleId],
    ['LOG_CHANNEL_ID', config.logChannelId],
    ['VERIFY_CHANNEL_ID', config.verifyChannelId],
  ];

  const missing = required.filter(([, val]) => !val);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(([key]) => console.error(`   ${key}`));
    process.exit(1);
  }

  // Warn about course roles but don't crash — the bot can still work without them
  const courseRoles = [
    ['IBCC_ROLE_ID', config.ibccRoleId],
    ['CF_ROLE_ID', config.cfRoleId],
    ['ENG_ROLE_ID', config.engRoleId],
    ['MATH101_ROLE_ID', config.math101RoleId],
  ];
  courseRoles.forEach(([key, val]) => {
    if (!val) console.warn(`⚠️  ${key} is not set — course role will not be assigned.`);
  });
}

module.exports = { config, validateConfig };
