const Database = require("better-sqlite3");
const path = require("path");

let standaloneDb = null;

function getStandaloneDbPath() {
  const entryDir = require.main
    ? path.dirname(require.main.filename)
    : process.cwd();
  return path.join(entryDir, "infrakit-logger.db");
}

function getStandaloneDb() {
  if (!standaloneDb) {
    standaloneDb = new Database(getStandaloneDbPath());
    standaloneDb.pragma("journal_mode = WAL");
  }
  return standaloneDb;
}

function ensureTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ik_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      level TEXT NOT NULL,
      method TEXT,
      route TEXT,
      ip TEXT,
      status INTEGER,
      latency_ms INTEGER,
      user_agent TEXT,
      message TEXT,
      meta TEXT
    )
  `);
}

module.exports = { getStandaloneDb, ensureTable };