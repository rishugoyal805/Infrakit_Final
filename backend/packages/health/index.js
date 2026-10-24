const { runChecks, aggregateStatus } = require("./runner");
const { createHttpCheck, createMongoCheck, createRedisCheck } = require("./checks");

const START_TIME = Date.now();

let registeredChecks = [];
let routePath = "/health";
let lastStatus = null;

let core = null;
try {
  core = require("@infrakit/core");
} catch (e) {
  console.log("[infrakit/health] running standalone, no core detected:", e.message);
}

function init(options = {}) {
  let effectiveOptions = options;

  if (core) {
    const cfg = core.config();
    if (cfg.health) {
      effectiveOptions = cfg.health;
      console.log("[health] using config from infrakit.config.js");
    }
    core.register("health", { version: "0.1.0" });
  }

  if (!Array.isArray(effectiveOptions.checks)) {
    throw new Error("@infrakit/health: init() requires options.checks to be an array");
  }

  for (const c of effectiveOptions.checks) {
    if (!c || typeof c.fn !== "function" || !c.name) {
      throw new Error("@infrakit/health: each check needs { name, fn }");
    }
  }

  registeredChecks = effectiveOptions.checks;
  routePath = effectiveOptions.path || "/health";
}

async function check() {
  const results = await runChecks(registeredChecks);
  const status = aggregateStatus(results);

  if (core && status !== lastStatus && (status === "degraded" || status === "down")) {
    core.bus.emit("health_degraded", { status, checks: results });
  }
  lastStatus = status;

  return {
    status,
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    checks: results
  };
}

function middleware() {
  return async function healthMiddleware(req, res, next) {
    if (req.method !== "GET" || req.path !== routePath) {
      return next();
    }
    try {
      const result = await check();
      res.status(result.status === "down" ? 503 : 200).json(result);
    } catch (err) {
      res.status(500).json({
        status: "down",
        uptime: Math.floor((Date.now() - START_TIME) / 1000),
        checks: [],
        error: err.message
      });
    }
  };
}

module.exports = {
  init,
  middleware,
  check,
  createHttpCheck,
  createMongoCheck,
  createRedisCheck
};