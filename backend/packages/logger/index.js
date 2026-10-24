const { getStandaloneDb, ensureTable } = require("./db");
const { createWriteBuffer } = require("./buffer");

let core = null;
try {
  core = require("@infrakit/core");
} catch (e) {
  console.log("[infrakit/logger] running standalone, no core detected:", e.message);
}

function getDb() {
  if (core) {
    const db = core.db();
    ensureTable(db);
    return db;
  }
  const db = getStandaloneDb();
  ensureTable(db);
  return db;
}

let writeBuffer = null;

function baseEntry(level, overrides = {}) {
  return {
    timestamp: Date.now(),
    level,
    method: null,
    route: null,
    ip: null,
    status: null,
    latency_ms: null,
    user_agent: null,
    message: null,
    meta: null,
    ...overrides
  };
}

function log(level, message, meta = {}) {
  if (!writeBuffer) {
    throw new Error("[infrakit/logger] log() called before init() — call logger.init() first");
  }
  writeBuffer.push(baseEntry(level, { message, meta: JSON.stringify(meta) }));
}

const logger = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta)
};

function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const latency_ms = Date.now() - start;
    writeBuffer.push(
      baseEntry("request", {
        method: req.method,
        route: req.originalUrl,
        ip: req.ip,
        status: res.statusCode,
        latency_ms,
        user_agent: req.headers["user-agent"] || null
      })
    );

    if (core) {
      core.bus.emit("logger:entry_written", {
        method: req.method,
        route: req.originalUrl,
        status: res.statusCode,
        latency_ms
      });
    }
  });

  next();
}

function init(app, options = {}) {
  let effectiveOptions = options;

  if (core) {
    core.register("logger", { version: "0.1.0" });
    const cfg = core.config();
    if (cfg.logger) {
      effectiveOptions = cfg.logger;
      console.log("[logger] using config from infrakit.config.js");
    }
  }

  writeBuffer = createWriteBuffer(getDb, {
    maxBufferSize: effectiveOptions.maxBufferSize,
    flushIntervalMs: effectiveOptions.flushIntervalMs
  });

  if (app) {
    app.use(requestLoggerMiddleware);
  }
}

module.exports = {
  init,
  log: logger,
  middleware: requestLoggerMiddleware,
  getDroppedCount: () => (writeBuffer ? writeBuffer.getDroppedCount() : 0),
  _flush: () => writeBuffer && writeBuffer.flush()
};