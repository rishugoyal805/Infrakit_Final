import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import "dotenv/config";

const dbPath = process.env.DB_PATH || "./data/platform.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  graph_json TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  -- Per-project dashboard secret. NOTE: this is encrypted (AES-256-GCM,
  -- reversible), not bcrypt-hashed like a password — the platform must be
  -- able to recover the plaintext to sign JWTs with it at /auth/verify time
  -- (spec's option (a), local JWT verification). A true one-way hash would
  -- make that impossible. The plaintext is shown to the user exactly once,
  -- at export time, and never returned by any read endpoint after that.
  dashboard_secret_enc TEXT,
  dashboard_secret_created_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Lightweight migration helper, since "CREATE TABLE IF NOT EXISTS" does nothing
// for already-existing tables (this bit InfraKit's own @infrakit/queue once —
// same fix applied here preemptively).
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}
ensureColumn("projects", "dashboard_secret_enc", "dashboard_secret_enc TEXT");
ensureColumn("projects", "dashboard_secret_created_at", "dashboard_secret_created_at TEXT");

// dashboard_access_key: stable, plain identifier for the new credential-relay
// dashboard login (see routes/dashboardCredentials.js) — generated once,
// reused across exports, not secret (it's an identifier, like a client ID).
// dashboard_access_password_hash: bcrypt hash of the password that gates
// that same endpoint — this one CAN be a true one-way hash (unlike the old
// dashboard_secret_enc above), because verify-credentials only ever needs
// to compare, never recover, the plaintext.
ensureColumn("projects", "dashboard_access_key", "dashboard_access_key TEXT");
ensureColumn("projects", "dashboard_access_password_hash", "dashboard_access_password_hash TEXT");
ensureColumn("projects", "dashboard_access_password_created_at", "dashboard_access_password_created_at TEXT");
