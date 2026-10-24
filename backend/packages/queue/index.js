const { getStandaloneDb, ensureTables } = require("./db");
const { createWorker } = require("./worker");
const { rotateSuccessfulJobs, rotateFailedJobs } = require("./rotation");

let core = null;
try {
  core = require("@infrakit/core");
} catch (e) {
  console.log("[infrakit/queue] running standalone, no core detected:", e.message);
}

let dbInstance = null;
function getDb() {
  if (dbInstance) return dbInstance;
  if (core) {
    dbInstance = core.db();
    ensureTables(dbInstance);
  } else {
    dbInstance = getStandaloneDb();
    ensureTables(dbInstance);
  }
  return dbInstance;
}

const handlers = new Map();
let worker = null;
let rotationThreshold = 100;

function add(queueName, payload, options = {}) {
  const db = getDb();
  const now = Date.now();
  const runAt = options.delayMs ? now + options.delayMs : now;

  const result = db.prepare(`
    INSERT INTO ik_queue_jobs (queue_name, payload, status, priority, run_at, max_attempts, created_at, updated_at)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(
    queueName,
    JSON.stringify(payload),
    options.priority || 0,
    runAt,
    options.maxAttempts || 3,
    now,
    now
  );

  return result.lastInsertRowid;
}

function process_(queueName, handlerFn) {
  handlers.set(queueName, handlerFn);
}

function getStats(queueName) {
  const db = getDb();
  const where = queueName ? "WHERE queue_name = ?" : "";
  const args = queueName ? [queueName] : [];

  const pending = db.prepare(`SELECT COUNT(*) as cnt FROM ik_queue_jobs WHERE status = 'pending' ${queueName ? "AND queue_name = ?" : ""}`).get(...args);
  const done = db.prepare(`SELECT COUNT(*) as cnt FROM ik_queue_jobs WHERE status = 'done' AND failed = 0 ${queueName ? "AND queue_name = ?" : ""}`).get(...args);
  const failed = db.prepare(`SELECT COUNT(*) as cnt FROM ik_queue_jobs WHERE status = 'done' AND failed = 1 ${queueName ? "AND queue_name = ?" : ""}`).get(...args);

  return { pending: pending.cnt, done: done.cnt, failed: failed.cnt };
}

function init(options = {}) {
  let effectiveOptions = options;

  if (core) {
    core.register("queue", { version: "0.1.0" });
    const cfg = core.config();
    if (cfg.queue) {
      effectiveOptions = cfg.queue;
      console.log("[queue] using config from infrakit.config.js");
    }
  }

  const successRotationThreshold = effectiveOptions.rotationThreshold || 100;
  const failedRotationThreshold = effectiveOptions.failedRotationThreshold || 1000;

  worker = createWorker(getDb, handlers, {
    pollIntervalMs: effectiveOptions.pollIntervalMs || 1000,
    batchSize: effectiveOptions.batchSize || 5,
    onJobCompleted: (info) => {
      const db = getDb();
      rotateSuccessfulJobs(db, successRotationThreshold);
      if (core) core.bus.emit("queue:job_completed", info);
    },
    onJobFailed: (info) => {
      const db = getDb();
      rotateFailedJobs(db, failedRotationThreshold);
      if (core) core.bus.emit("queue:job_failed", info);
    }
  });
}

function getJob(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM ik_queue_jobs WHERE id = ?").get(id);

  if (!row) return null;

  return {
    id: row.id,
    queue: row.queue_name,
    status: row.status,
    failed: !!row.failed,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lastError: row.last_error,
    result: row.result ? JSON.parse(row.result) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  init,
  add,
  process: process_,
  getStats,
  getJob
};