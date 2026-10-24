const Database = require("better-sqlite3");
const path = require("path");

let standaloneDb = null;

function getStandaloneDbPath() {
  const entryDir = require.main
    ? path.dirname(require.main.filename)
    : process.cwd();
  return path.join(entryDir, "infrakit-queue.db");
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
    CREATE TABLE IF NOT EXISTS ik_queue_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_name TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER NOT NULL DEFAULT 0,
      run_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      last_error TEXT,
      failed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ik_queue_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      attempt_number INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      success INTEGER NOT NULL,
      error TEXT,
      duration_ms INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_pending
      ON ik_queue_jobs (status, queue_name, run_at);
  `);

  // CREATE TABLE IF NOT EXISTS does nothing to a table that already
  // exists — adding a column here only affects fresh databases. Any
  // schema change to an existing table needs an explicit migration
  // check like this, or existing installs silently break.
  const columns = db.prepare("PRAGMA table_info(ik_queue_jobs)").all();
  const hasResultColumn = columns.some((c) => c.name === "result");
  if (!hasResultColumn) {
    db.exec("ALTER TABLE ik_queue_jobs ADD COLUMN result TEXT");
    console.log("[infrakit/queue] migrated: added 'result' column to ik_queue_jobs");
  }
}

module.exports = { getStandaloneDb, ensureTables };