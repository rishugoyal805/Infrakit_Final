const Database = require("better-sqlite3");
const path = require("path");

let standaloneDb = null;

function getStandaloneDbPath() {
  const entryDir = require.main
    ? path.dirname(require.main.filename)
    : process.cwd();
  return path.join(entryDir, "infrakit-fn.db");
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
    CREATE TABLE IF NOT EXISTS ik_fn_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fn_name TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_source TEXT,
      status TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      error_message TEXT,
      timestamp INTEGER NOT NULL
    );
  `);
}

module.exports = { getStandaloneDb, ensureTables };