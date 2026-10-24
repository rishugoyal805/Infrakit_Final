const Database = require("better-sqlite3");
const path = require("path");

let standaloneDb = null;

function getStandaloneDbPath() {
  const entryDir = require.main
    ? path.dirname(require.main.filename)
    : process.cwd();
  return path.join(entryDir, "infrakit-shield.db");
}

function getStandaloneDb() {
  if (!standaloneDb) {
    standaloneDb = new Database(getStandaloneDbPath());
    standaloneDb.pragma("journal_mode = WAL");
  }
  return standaloneDb;
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ik_security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      type TEXT NOT NULL,
      ip TEXT,
      route TEXT,
      reason TEXT,
      meta TEXT
    );

    CREATE TABLE IF NOT EXISTS ik_blocked_ips (
      ip TEXT PRIMARY KEY,
      reason TEXT,
      blocked_at INTEGER NOT NULL
    );
  `);
}

module.exports = { getStandaloneDb, ensureTables };