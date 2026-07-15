// ─── Database Module ───────────────────────────────────────────────────────────
// Uses better-sqlite3 to manage the SQLite database.
// Automatically creates the database file and the verified_users table on first load.
// All queries are parameterised to prevent SQL injection.
// ───────────────────────────────────────────────────────────────────────────────

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'database', 'verification.db');

let db;

/**
 * Initialises the database connection and creates the table if it doesn't exist.
 * @returns {boolean} True if successful
 */
function initDatabase() {
  try {
    db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');

    // Create the verified_users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS verified_users (
        discord_id   TEXT PRIMARY KEY,
        username     TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        student_id   TEXT NOT NULL UNIQUE,
        course       TEXT NOT NULL,
        verified_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    return true;
  } catch (err) {
    console.error('❌ Failed to initialise database:', err.message);
    return false;
  }
}

/**
 * Returns the database instance. Must call initDatabase() first.
 */
function getDb() {
  if (!db) throw new Error('Database not initialised. Call initDatabase() first.');
  return db;
}

/**
 * Inserts a newly verified user.
 * @param {string} discordId
 * @param {string} username   - Discord username (e.g. user#1234 or global name)
 * @param {string} displayName - Guild display name (nickname)
 * @param {string} studentId   - Last 3 digits of student ID
 * @param {string} course      - Normalised course code
 * @returns {boolean} True if inserted successfully
 */
function insertUser(discordId, username, displayName, studentId, course) {
  const stmt = getDb().prepare(`
    INSERT INTO verified_users (discord_id, username, display_name, student_id, course)
    VALUES (?, ?, ?, ?, ?)
  `);
  try {
    stmt.run(discordId, username, displayName, studentId, course);
    return true;
  } catch (err) {
    // UNIQUE constraint violations bubble up — caller handles them
    throw err;
  }
}

/**
 * Checks whether a student ID is already taken.
 * @param {string} studentId
 * @returns {boolean}
 */
function isStudentIdTaken(studentId) {
  const row = getDb().prepare('SELECT 1 FROM verified_users WHERE student_id = ?').get(studentId);
  return !!row;
}

/**
 * Fetches a user record by student ID.
 * @param {string} studentId
 * @returns {object|undefined}
 */
function getUserByStudentId(studentId) {
  return getDb().prepare('SELECT * FROM verified_users WHERE student_id = ?').get(studentId);
}

/**
 * Fetches a user record by Discord ID.
 * @param {string} discordId
 * @returns {object|undefined}
 */
function getUserByDiscordId(discordId) {
  return getDb().prepare('SELECT * FROM verified_users WHERE discord_id = ?').get(discordId);
}

/**
 * Deletes a user record by Discord ID.
 * @param {string} discordId
 * @returns {boolean} True if a row was deleted
 */
function deleteUser(discordId) {
  const info = getDb().prepare('DELETE FROM verified_users WHERE discord_id = ?').run(discordId);
  return info.changes > 0;
}

/**
 * Returns the total number of verified users.
 * @returns {number}
 */
function getTotalVerified() {
  const row = getDb().prepare('SELECT COUNT(*) AS count FROM verified_users').get();
  return row.count;
}

/**
 * Returns all verified user records.
 * @returns {object[]}
 */
function getAllUsers() {
  return getDb().prepare('SELECT * FROM verified_users ORDER BY verified_at DESC').all();
}

/**
 * Closes the database connection.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  insertUser,
  isStudentIdTaken,
  getUserByStudentId,
  getUserByDiscordId,
  deleteUser,
  getTotalVerified,
  getAllUsers,
  closeDatabase,
};
