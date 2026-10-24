/**
 * ============================================================================
 * SOURCED FROM THE REAL REPO (packages.zip, uploaded) — not guessed.
 * ============================================================================
 * Every default below is copied from an actual example.config.js, or (where
 * no example.config.js exists) from the fallback value in that package's own
 * index.js — cited in a comment either way. Every configKey is confirmed
 * against the literal `cfg.<key>` each package's index.js reads from
 * core.config(). Every envVar is confirmed against the uploaded
 * `_env.example`.
 *
 * Two things are deliberately NOT exposed as typeable panel fields, both
 * explained inline below: loadbalancer's `email.auth.pass` (a real secret —
 * matches a bug already found and fixed once in this repo, per the session
 * summary), and health's `checks` (the real shape is JS functions, not
 * JSON-serializable data).
 *
 * Field shape: { key, type: 'number'|'string'|'boolean'|'json', default, label? }
 * `configKey` is the top-level key this package's block lives under in
 * infrakit.config.js — NOT always the same as the palette/node type name
 * (e.g. node type "rate-limiter" writes to config key "rateLimiter").
 * ============================================================================
 */

export const PACKAGE_CATALOG = {
  core: {
    label: "Core",
    npmName: "@infrakit/core",
    configKey: null, // core has no config block of its own — it just loads the file
    description:
      "Shared SQLite db, event bus, config loader, package registry. Always required first.",
    fields: [],
    // core/README documents `secret: process.env.INFRAKIT_SECRET` at the top
    // level of infrakit.config.js, but no package in this codebase actually
    // reads `.secret` (checked — dashboard uses its own username/password
    // instead). Leaving it out rather than wiring up an unused field.
    envVars: [],
    wireKind: "require-only", // core.index.js exports { db, bus, config, register, listPackages } — not a callable
  },

  "rate-limiter": {
    label: "Rate Limiter",
    npmName: "@infrakit/rate-limiter",
    configKey: "rateLimiter",
    description:
      "Sliding-window token bucket rate limiting, emits rate_limit_exceeded.",
    fields: [
      {
        key: "routes",
        type: "json",
        label: "Routes (path → { capacity, refillRate })",
        // Documented example from rate-limiter/README.md, also matches the
        // values wired in demo-app/app.js (capacity 3 per route).
        default: JSON.stringify(
          {
            "/api": { capacity: 3, refillRate: 0.5 },
            "/other": { capacity: 3, refillRate: 0.5 },
          },
          null,
          2,
        ),
      },
    ],
    envVars: [], // no INFRAKIT_RATE_LIMITER_* var found in _env.example
    wireKind: "apply-rate-limits", // exports applyRateLimits(app, routeConfigs) — not .init()
  },

  shield: {
    label: "Shield",
    npmName: "@infrakit/shield",
    configKey: "shield",
    description:
      "IP blocklist, cross-route brute-force detection (listens to rate-limiter's events), SQLi/path-traversal flagging (flag-only).",
    fields: [
      { key: "bruteForceThreshold", type: "number", default: 5 }, // shield/index.js fallback: `|| 5`
      { key: "bruteForceWindowMs", type: "number", default: 60000 }, // shield/index.js fallback: `|| 60 * 1000`
    ],
    envVars: [],
    wireKind: "init-app", // shield.init(app, options) — mounts its own middleware internally
  },

  logger: {
    label: "Logger",
    npmName: "@infrakit/logger",
    configKey: "logger",
    description:
      "Buffered write (flush every 500ms, 100-entry cap), request + manual logging.",
    fields: [
      { key: "maxBufferSize", type: "number", default: 100 }, // logger/buffer.js fallback: `|| 100`
      { key: "flushIntervalMs", type: "number", default: 500 }, // logger/buffer.js fallback: `|| 500`
    ],
    envVars: [],
    wireKind: "init-app", // logger.init(app) — mounts its own middleware internally
  },

  health: {
    label: "Health",
    npmName: "@infrakit/health",
    configKey: "health",
    description: "Parallel dependency checks, ok/degraded/down aggregation.",
    fields: [
      { key: "path", type: "string", default: "/health" }, // health/index.js fallback: `|| "/health"`
      // `checks` is deliberately NOT a form field: example.config.js shows it
      // as an array built via createHttpCheck(...), which returns objects
      // containing a JS check function — not something a number/string/
      // boolean/json form field can represent. The generated config.js
      // includes a placeholder comment telling the user to add checks by
      // hand instead of silently dropping them.
    ],
    envVars: [],
    wireKind: "init-then-middleware", // health.init({}) then separately app.use(health.middleware())
  },

  queue: {
    label: "Queue",
    npmName: "@infrakit/queue",
    configKey: "queue",
    description:
      "SQLite job table, pending/done states, exponential backoff retry, priority + delayed jobs.",
    fields: [
      { key: "pollIntervalMs", type: "number", default: 1000 }, // example.config.js
      { key: "batchSize", type: "number", default: 5 }, // example.config.js
      {
        key: "rotationThreshold",
        type: "number",
        default: 100,
        label: "Successful-job rotation cap",
      }, // example.config.js
      {
        key: "failedRotationThreshold",
        type: "number",
        default: 1000,
        label: "Failed-job rotation cap",
      }, // example.config.js
    ],
    envVars: [],
    wireKind: "init-only", // queue.init(config); you call queue.process()/queue.add() yourself elsewhere
  },

  cache: {
    label: "Cache",
    npmName: "@infrakit/cache",
    configKey: "cache",
    description:
      "In-memory Map with TTL + entry cap (or Redis, if redisUrl is set), optional AES-256-GCM per-value encryption.",
    fields: [
      {
        key: "redisUrl",
        type: "string",
        default: "",
        label: "Redis URL (blank = in-memory)",
      }, // example.config.js: null
      { key: "maxEntries", type: "number", default: 100 }, // example.config.js — memory mode only
      { key: "encryptByDefault", type: "boolean", default: false }, // example.config.js
      // encryptionKey is intentionally NOT a typed field — example.config.js
      // sources it from process.env.CACHE_ENCRYPTION_KEY, and the generator
      // always emits that same env reference rather than a literal value.
    ],
    envVars: ["CACHE_ENCRYPTION_KEY"], // confirmed in uploaded _env.example — NOT INFRAKIT_-prefixed
    wireKind: "init-only", // cache.init(config); you mount cache.route(ttl) on specific routes yourself
  },

  breaker: {
    label: "Breaker",
    npmName: "@infrakit/breaker",
    configKey: "breaker",
    description:
      "Three-state FSM (CLOSED/OPEN/HALF_OPEN) circuit breaker, SQLite-backed.",
    fields: [
      { key: "failureRateThreshold", type: "number", default: 0.5 }, // example.config.js
      { key: "minimumRequests", type: "number", default: 5 }, // example.config.js
      { key: "openTimeoutMs", type: "number", default: 10000 }, // example.config.js
      { key: "successCountToClose", type: "number", default: 2 }, // example.config.js
    ],
    envVars: [],
    wireKind: "init-only", // breaker.init(config); you wrap calls yourself with breaker.execute(name, fn)
  },

  fn: {
    label: "Fn",
    npmName: "@infrakit/fn",
    configKey: "fn",
    description:
      "Lambda-pattern package: http/queue/cron triggers, registered in code via fn.register(), not via this panel.",
    fields: [
      { key: "rotationThreshold", type: "number", default: 100 }, // example.config.js
    ],
    envVars: [],
    wireKind: "init-app", // fn.init(app, config) — needs app for http-triggered functions
  },

  loadbalancer: {
    label: "Load Balancer",
    npmName: "smart-stick-loadbalancer", // confirmed in packages/loadbalancer/package.json — NOT @infrakit-scoped
    configKey: "loadBalancer",
    description:
      "Sticky-session load balancer with health checks, failover, and optional email alerts.",
    fields: [
      { key: "strategy", type: "string", default: "round-robin" }, // code fallback: `|| "round-robin"`
      { key: "port", type: "number", default: 3001 }, // no code default — README example value; required
      {
        key: "backends",
        type: "json",
        label: "Backends (array)",
        default: JSON.stringify(
          [
            {
              id: 0,
              url: "http://localhost:5000",
              weight: 1,
              healthPath: "/health",
            },
          ],
          null,
          2,
        ),
      },
      {
        key: "health",
        type: "json",
        label: "Health check options",
        default: JSON.stringify(
          {
            interval: 10000,
            path: "/",
            method: "GET",
            algorithm: "http-status",
            timeout: 2000,
          },
          null,
          2,
        ), // all values from loadbalancer/README.md's documented defaults table
      },
      // `email` is intentionally NOT a form field. Its `auth.pass` is a real
      // secret (a Gmail app password, per the loadbalancer README) — this
      // repo already had one hardcoded in a test config and had to rotate
      // it. The generator always emits env references for this block
      // instead of ever accepting a literal value here.
    ],
    envVars: ["LB_ALERT_EMAIL", "LB_ALERT_PASS"], // confirmed in uploaded _env.example
    // createStickyProxy(config).start() runs its OWN http server on its own
    // port — it's a standalone reverse proxy in front of your app, not
    // Express middleware mounted inside it. It does not belong in the
    // app.use() chain at all.
    wireKind: "standalone-process",
  },

  dashboard: {
    label: "Dashboard",
    npmName: "@infrakit/dashboard",
    configKey: "dashboard",
    description:
      "Embedded EJS admin UI with its own username/password session login. Requires core, no standalone mode.",
    fields: [
      // username/password are never typed here as literals — see
      // generateConfig.js. The panel just shows that this node exists;
      // credentials are always env-sourced.
    ],
    envVars: ["DASHBOARD_USERNAME", "DASHBOARD_PASSWORD"], // confirmed in uploaded _env.example
    wireKind: "init-app", // dashboard.init(app, options)
  },
};

export const NODE_TYPES = Object.keys(PACKAGE_CATALOG);
