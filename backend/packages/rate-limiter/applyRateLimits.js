const tokenBucketLimiter = require("./tokenBucket");

function applyRateLimits(app, routeConfigs) {
  let core = null;
  let effectiveRouteConfigs = routeConfigs;

  try {
    core = require("@infrakit/core");
    core.register("rate-limiter", { version: "0.1.0" });

    const cfg = core.config();
    if (cfg.rateLimiter && cfg.rateLimiter.routes) {
      effectiveRouteConfigs = cfg.rateLimiter.routes;
      console.log("[rate-limiter] using route config from infrakit.config.js");
    }
  } catch (e) {
    console.log("[rate-limiter] running standalone, no core detected:", e.message);
  }

  for (const [route, config] of Object.entries(effectiveRouteConfigs)) {
    const limiter = tokenBucketLimiter(config);
    app.use(route, limiter);
  }
}

module.exports = applyRateLimits;