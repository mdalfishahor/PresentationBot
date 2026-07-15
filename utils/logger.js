// ─── Logger Utility ────────────────────────────────────────────────────────────
// Writes log entries to a daily log file in the logs/ directory.
// Each entry is timestamped with the local time.
// ───────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');

/**
 * Ensures the logs directory exists.
 */
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Returns today's log file path (e.g. logs/2025-07-15.log).
 */
function getLogFilePath() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return path.join(LOG_DIR, `${yyyy}-${mm}-${dd}.log`);
}

/**
 * Appends a formatted log line to today's log file.
 * @param {'INFO'|'WARN'|'ERROR'} level
 * @param {string} message
 */
function writeLog(level, message) {
  ensureLogDir();
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const line = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFile(getLogFilePath(), line, (err) => {
    if (err) console.error('Failed to write log file:', err.message);
  });
}

/**
 * Logs a verification success.
 */
function logSuccess(discordId, username, studentId, course) {
  writeLog('INFO', `VERIFY SUCCESS | ${username} (${discordId}) | ID: ${studentId} | ${course}`);
}

/**
 * Logs a verification failure.
 */
function logFailure(discordId, username, reason, detail = '') {
  const extra = detail ? ` | ${detail}` : '';
  writeLog('WARN', `VERIFY FAIL    | ${username} (${discordId}) | ${reason}${extra}`);
}

/**
 * Logs a general bot event.
 */
function logEvent(event, detail = '') {
  const extra = detail ? ` | ${detail}` : '';
  writeLog('INFO', `${event}${extra}`);
}

module.exports = { logSuccess, logFailure, logEvent };
