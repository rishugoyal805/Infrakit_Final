const { getStandaloneDb, ensureTables } = require("./db");
const { inspectRequest } = require("./patterns");
const { createBruteForceTracker } = require("./bruteforce");

let core = null;
try {
  core = require("@infrakit/core");
} catch (e) {
  console.log("[infrakit/shield] running standalone, no core detected:", e.message);
}

function getDb() {
  if (core) {
    const db = core.db();
    ensureTables(db);
    return db;
  }
  const db = getStandaloneDb();
  ensureTables(db);
  return db;
}

const blockedIpsCache = new Set(); // in-memory mirror for fast per-request lookup
let tracker = null;

function loadBlockedIpsIntoCache() {
  const db = getDb();
  const rows = db.prepare("SELECT ip FROM ik_blocked_ips").all();
  rows.forEach((r) => blockedIpsCache.add(r.ip));
}

function logSecurityEvent(type, ip, route, reason, meta = {}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO ik_security_events (timestamp, type, ip, route, reason, meta)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(Date.now(), type, ip, route, reason, JSON.stringify(meta));
}

function blockIp(ip, reason = "manual") {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO ik_blocked_ips (ip, reason, blocked_at)
    VALUES (?, ?, ?)
  `).run(ip, reason, Date.now());
  blockedIpsCache.add(ip);

  logSecurityEvent("ip_blocked", ip, null, reason);

  if (core) {
    core.bus.emit("ip_blocked", { ip, reason });
  }
}

function unblockIp(ip) {
  const db = getDb();
  db.prepare("DELETE FROM ik_blocked_ips WHERE ip = ?").run(ip);
  blockedIpsCache.delete(ip);
}

function isBlocked(ip) {
  return blockedIpsCache.has(ip);
}

function init(app, options = {}) {
  let effectiveOptions = options;

  if (core) {
    const cfg = core.config();
    if (cfg.shield) {
      effectiveOptions = cfg.shield;
      console.log("[shield] using config from infrakit.config.js");
    }
  }

  tracker = createBruteForceTracker({
    threshold: effectiveOptions.bruteForceThreshold || 5,
    windowMs: effectiveOptions.bruteForceWindowMs || 60 * 1000,
  });

  loadBlockedIpsIntoCache();

  if (core) {
    core.register("shield", { version: "0.1.0" });

    core.bus.on("rate_limit_exceeded", (payload) => {
      const { ip } = payload;
      if (!ip) return;

      tracker.recordFailure(ip, payload.route || "unknown");

      if (tracker.isHittingMultipleRoutes(ip)) {
        blockIp(ip, "brute_force");
      }
    });
  }

  if (app) {
    app.use(shieldMiddleware);
  }
}

function shieldMiddleware(req, res, next) {
  const ip = req.ip;

  if (isBlocked(ip)) {
    logSecurityEvent("blocked_request", ip, req.originalUrl, "ip_in_blocklist");
    return res.status(403).json({ error: "Forbidden" });
  }

  const inspection = inspectRequest(req);
  if (inspection.flagged) {
    logSecurityEvent("suspicious_request", ip, req.originalUrl, inspection.reason);
    if (core) {
      core.bus.emit("suspicious_request", { ip, route: req.originalUrl, reason: inspection.reason });
    }
    // Flag and log, but don't auto-block on a single suspicious request —
    // that's a policy choice: one bad-looking request could be a false
    // positive. Blocking requires repeated brute-force pattern, not one hit.
  }

  next();
}

module.exports = {
  init,
  middleware: shieldMiddleware,
  blockIp,
  unblockIp,
  isBlocked,
  _tracker: () => tracker // exposed for testing
};