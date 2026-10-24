const Database = require("better-sqlite3");
const path = require("path");

let standaloneDb = null;

function getStandaloneDbPath() {
  const entryDir = require.main
    ? path.dirname(require.main.filename)
    : process.cwd();
  return path.join(entryDir, "infrakit-breaker.db");
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
    CREATE TABLE IF NOT EXISTS ik_circuit_breakers (
      name TEXT PRIMARY KEY,
      state TEXT NOT NULL DEFAULT 'CLOSED',
      request_count INTEGER NOT NULL DEFAULT 0,
      failure_count INTEGER NOT NULL DEFAULT 0,
      success_count_in_half_open INTEGER NOT NULL DEFAULT 0,
      probing INTEGER NOT NULL DEFAULT 0,
      opened_at INTEGER,
      updated_at INTEGER NOT NULL
    );
  `);
}

module.exports = { getStandaloneDb, ensureTables };