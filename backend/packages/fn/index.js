const { getStandaloneDb, ensureTables } = require("./db");
const { rotateExecutions } = require("./rotation");
const { createCronScheduler } = require("./cron");

let core = null;
try {
  core = require("@infrakit/core");
} catch (e) {
  console.log("[infrakit/fn] running standalone, no core detected:", e.message);
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

const fns = new Map();
let rotationThreshold = 100;
let appRef = null;
let initialized = false;

function parseTrigger(triggerStr) {
  const httpMatch = triggerStr.match(/^http:([A-Za-z]+):(.+)$/);
  if (httpMatch) {
    return { type: "http", method: httpMatch[1].toUpperCase(), path: httpMatch[2] };
  }
  if (triggerStr.startsWith("queue:")) {
    return { type: "queue", queueName: triggerStr.slice(6) };
  }
  if (triggerStr.startsWith("cron:")) {
    return { type: "cron", cronExpr: triggerStr.slice(5) };
  }
  throw new Error(`[infrakit/fn] unrecognized trigger format: "${triggerStr}"`);
}

function logExecution(name, triggerInfo, status, durationMs, errorMessage) {
  const db = getDb();
  db.prepare(`
    INSERT INTO ik_fn_executions (fn_name, trigger_type, trigger_source, status, duration_ms, error_message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, triggerInfo.type, triggerInfo.source || null, status, durationMs, errorMessage, Date.now());

  rotateExecutions(getDb(), rotationThreshold);
}

// Core execution wrapper — enforces timeout, logs every attempt, emits
// events. Returns a result object rather than throwing, so each trigger
// type (http/queue/cron) can decide independently how to react to failure.
async function runFn(name, payload, triggerInfo) {
  const def = fns.get(name);
  if (!def) {
    throw new Error(`[infrakit/fn] no function registered with name "${name}"`);
  }

  const start = Date.now();

  try {
    const result = await Promise.race([
      def.handler(payload),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), def.timeout);
      })
    ]);

    const durationMs = Date.now() - start;
    logExecution(name, triggerInfo, "success", durationMs, null);
    if (core) core.bus.emit("fn:execution_completed", { name, trigger: triggerInfo.type, durationMs });

    return { success: true, result };
  } catch (err) {
    const durationMs = Date.now() - start;
    const status = err.message === "timeout" ? "timeout" : "error";
    logExecution(name, triggerInfo, status, durationMs, err.message);
    if (core) core.bus.emit("fn:execution_failed", { name, trigger: triggerInfo.type, error: err.message, status });

    return { success: false, error: err.message, status };
  }
}

function wireHttpTrigger(name, def) {
  if (!appRef) {
    throw new Error(`[infrakit/fn] "${name}" uses an http trigger but init() was never called with an Express app`);
  }
  const method = def.trigger.method.toLowerCase();
  appRef[method](def.trigger.path, async (req, res) => {
    const outcome = await runFn(name, req.body, { type: "http", source: `${def.trigger.method}:${def.trigger.path}` });
    if (outcome.success) {
      res.json(outcome.result ?? { ok: true });
    } else {
      res.status(outcome.status === "timeout" ? 504 : 500).json({ error: outcome.error });
    }
  });
}

function wireQueueTrigger(name, def) {
  let queue;
  try {
    queue = require("@infrakit/queue");
  } catch (e) {
    throw new Error(`[infrakit/fn] "${name}" uses a queue trigger but @infrakit/queue is not installed`);
  }

  queue.process(def.trigger.queueName, async (payload) => {
    const outcome = await runFn(name, payload, { type: "queue", source: def.trigger.queueName });
    if (!outcome.success) {
      // Re-throw so @infrakit/queue's own retry/backoff mechanism takes
      // over — fn logs its own execution history, but the actual retry
      // reliability belongs to queue, not duplicated here.
      throw new Error(outcome.error);
    }
    return outcome.result;
  });
}

let cronFnsCache = null;
function getCronFns() {
  if (!cronFnsCache) cronFnsCache = new Map();
  cronFnsCache.clear();
  for (const [name, def] of fns) {
    if (def.trigger.type === "cron") cronFnsCache.set(name, def);
  }
  return cronFnsCache;
}

function wireCronScheduler() {
  createCronScheduler(getCronFns, async (name) => {
    const def = fns.get(name);
    await runFn(name, null, { type: "cron", source: def.trigger.cronExpr });
  });
}

function register(name, options) {
  if (!initialized) {
    throw new Error(`[infrakit/fn] register("${name}", ...) called before init() — call fn.init(app) first`);
  }
  if (!options || typeof options.handler !== "function" || !options.trigger) {
    throw new Error(`[infrakit/fn] register("${name}", ...) requires { trigger, handler }`);
  }

  const trigger = parseTrigger(options.trigger);
  const def = { trigger, timeout: options.timeout || 5000, handler: options.handler };
  fns.set(name, def);

  if (trigger.type === "http") wireHttpTrigger(name, def);
  if (trigger.type === "queue") wireQueueTrigger(name, def);
  // cron fns are picked up automatically by the single scheduler's next tick — no per-fn wiring needed
}

function init(app, options = {}) {
  let effectiveOptions = options;

  if (core) {
    core.register("fn", { version: "0.1.0" });
    const cfg = core.config();
    if (cfg.fn) {
      effectiveOptions = cfg.fn;
      console.log("[fn] using config from infrakit.config.js");
    }
  }

  rotationThreshold = effectiveOptions.rotationThreshold || 100;
  appRef = app || null;
  initialized = true;

  wireCronScheduler();
}

module.exports = { init, register, runFn };