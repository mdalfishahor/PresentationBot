// ─── Anti-Spam Utility ─────────────────────────────────────────────────────────
// In-memory rate limiter that tracks verification attempts per Discord user.
// Blocks a user for config.blockDurationMs if they exceed config.maxAttempts
// within config.attemptWindowMs.
// ───────────────────────────────────────────────────────────────────────────────

const { config } = require('../config');

/**
 * Map<userId, number[]> — each entry holds timestamps (ms) of recent attempts.
 * @type {Map<string, number[]>}
 */
const attempts = new Map();

/**
 * Map<userId, number> — blocked-until timestamp (ms).
 * @type {Map<string, number>}
 */
const blocked = new Map();

// ── Periodic cleanup every 5 minutes to prevent memory leaks ──────────────────
setInterval(() => {
  const now = Date.now();

  // Remove expired attempt windows
  for (const [userId, timestamps] of attempts) {
    const recent = timestamps.filter((t) => now - t < config.attemptWindowMs);
    if (recent.length === 0) {
      attempts.delete(userId);
    } else {
      attempts.set(userId, recent);
    }
  }

  // Remove expired blocks
  for (const [userId, until] of blocked) {
    if (now >= until) blocked.delete(userId);
  }
}, 5 * 60 * 1000);

/**
 * Checks whether a user is currently blocked.
 * @param {string} userId - Discord user ID
 * @returns {{ blocked: boolean, remainingMs: number }}
 */
function isBlocked(userId) {
  const until = blocked.get(userId);
  if (!until) return { blocked: false, remainingMs: 0 };
  const remaining = until - Date.now();
  if (remaining <= 0) {
    blocked.delete(userId);
    return { blocked: false, remainingMs: 0 };
  }
  return { blocked: true, remainingMs: remaining };
}

/**
 * Records an attempt for a user and checks if they are now blocked.
 * @param {string} userId
 * @returns {{ allowed: boolean, remainingMs: number }}
 *   allowed: true if the attempt is permitted (under the limit)
 *   remainingMs: how long the block lasts (0 if not blocked)
 */
function recordAttempt(userId) {
  const now = Date.now();

  // If already blocked, reject immediately
  const blockStatus = isBlocked(userId);
  if (blockStatus.blocked) {
    return { allowed: false, remainingMs: blockStatus.remainingMs };
  }

  // Get recent attempts within the window
  const userAttempts = attempts.get(userId) || [];
  const recent = userAttempts.filter((t) => now - t < config.attemptWindowMs);

  // If at the limit, block them
  if (recent.length >= config.maxAttempts) {
    const until = now + config.blockDurationMs;
    blocked.set(userId, until);
    attempts.delete(userId);
    return { allowed: false, remainingMs: config.blockDurationMs };
  }

  // Record this attempt
  recent.push(now);
  attempts.set(userId, recent);
  return { allowed: true, remainingMs: 0 };
}

/**
 * Resets the rate-limit state for a user (used when admins manually /reset).
 * @param {string} userId
 */
function resetUser(userId) {
  attempts.delete(userId);
  blocked.delete(userId);
}

module.exports = { isBlocked, recordAttempt, resetUser };
