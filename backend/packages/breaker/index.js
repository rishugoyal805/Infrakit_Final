const { getStandaloneDb, ensureTables } = require("./db");
const { checkBeforeCall, recordSuccess, recordFailure } = require("./fsm");

let core = null;
try {
  core = require("@infrakit/core");
} catch (e) {
  console.log("[infrakit/breaker] running standalone, no core detected:", e.message);
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

let globalDefaults = {
  failureRateThreshold: 0.5,
  minimumRequests: 5,
  openTimeoutMs: 10000,
  successCountToClose: 2
};

function init(options = {}) {
  let effectiveOptions = options;

  if (core) {
    core.register("breaker", { version: "0.1.0" });
    const cfg = core.config();
    if (cfg.breaker) {
      effectiveOptions = cfg.breaker;
      console.log("[breaker] using config from infrakit.config.js");
    }
  }

  globalDefaults = { ...globalDefaults, ...effectiveOptions };
}

class BreakerOpenError extends Error {
  constructor(name) {
    super(`Circuit breaker '${name}' is OPEN — call rejected without attempting.`);
    this.name = "BreakerOpenError";
    this.breakerName = name;
  }
}

async function execute(name, fn, options = {}) {
  const db = getDb();
  const effectiveOptions = { ...globalDefaults, ...options };

  const { allowed, breaker } = checkBeforeCall(db, name, effectiveOptions);

  if (breaker.state === "HALF_OPEN" && allowed && core) {
    core.bus.emit("breaker:half_open", { name });
  }

  if (!allowed) {
    if (core) core.bus.emit("breaker:rejected", { name, state: breaker.state });
    throw new BreakerOpenError(name);
  }

  try {
    const result = await fn();
    const newState = recordSuccess(db, name, effectiveOptions);
    if (newState === "CLOSED" && breaker.state !== "CLOSED" && core) {
      core.bus.emit("breaker:closed", { name });
    }
    return result;
  } catch (err) {
    const newState = recordFailure(db, name, effectiveOptions);
    if (newState === "OPEN" && core) {
      core.bus.emit("breaker:opened", { name, error: err.message });
    }
    throw err; // caller still sees the real error, breaker doesn't swallow it
  }
}

function getState(name) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM ik_circuit_breakers WHERE name = ?").get(name);
  return row || null;
}

module.exports = { init, execute, getState, BreakerOpenError };