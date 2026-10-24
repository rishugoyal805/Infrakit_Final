const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function getDbPath() {
  const entryDir = require.main
    ? path.dirname(require.main.filename)
    : process.cwd(); // fallback for edge cases (e.g. REPL, some test runners)
  return path.join(entryDir, 'infrakit.db');
}

function openDb() {
  const DB_PATH = getDbPath();
  const isNew = !fs.existsSync(DB_PATH);
  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  const check = db.pragma('integrity_check', { simple: true });
  if (check !== 'ok') {
    console.error('[infrakit/core] integrity_check failed:', check);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS ik_configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  if (isNew) {
    console.log('[infrakit/core] created new infrakit.db at', DB_PATH);
  }

  return db;
}

module.exports = { openDb, getDbPath };