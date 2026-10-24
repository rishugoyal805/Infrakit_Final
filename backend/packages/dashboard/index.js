const path = require("path");
const {
  isLoginRateLimited,
  recordLoginAttempt,
  createSession,
  isValidSession,
  parseCookie,
} = require("./auth");

let core = null;
try {
  core = require("@infrakit/core");
} catch (e) {
  // handled explicitly in init() — dashboard has no meaningful standalone mode
}
const { TABLE_REGISTRY, tableExists, queryTable } = require("./tables");
const ROTATION_TABLES = [
  { table: "ik_logs", threshold: 1000 },
  { table: "ik_queue_jobs", threshold: 100 }, // approximate — mixes done/pending, see README
  { table: "ik_fn_executions", threshold: 100 },
  { table: "ik_security_events", threshold: 500 },
  { table: "ik_circuit_breakers", threshold: null }, // no rotation — persistent state, not a log
];

function getRotationStatus() {
  const db = core.db();
  return ROTATION_TABLES.map(({ table, threshold }) => {
    let rows = 0;
    try {
      const row = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get();
      rows = row.cnt;
    } catch (e) {
      rows = 0; // table doesn't exist yet — that package hasn't run in this app
    }
    return { table, rows, threshold: threshold === null ? "—" : threshold };
  });
}

function requireAuth(req, res, next) {
  const token = parseCookie(req, "infrakit_session");
  if (isValidSession(token)) return next();
  res.redirect(req.app.get("infrakit_basePath") || "/infrakit");
}

function init(app, options = {}) {
  if (!core) {
    throw new Error(
      "[infrakit/dashboard] @infrakit/core is required — dashboard reads shared state from core and has no standalone mode.",
    );
  }

  core.register("dashboard", { version: "0.1.0" });

  let effectiveOptions = options;
  const cfg = core.config();
  if (cfg.dashboard) {
    effectiveOptions = cfg.dashboard;
    console.log("[dashboard] using config from infrakit.config.js");
  }

  const basePath = effectiveOptions.basePath || "/infrakit";
  const username = effectiveOptions.username;
  const password = effectiveOptions.password;

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.set("infrakit_basePath", basePath);

  if (!password) {
    console.warn(
      "[infrakit/dashboard] no password configured — dashboard is disabled. Set dashboard.password in infrakit.config.js.",
    );
    app.get(basePath, (req, res) => res.render("disabled"));
    return;
  }

  app.get(basePath, (req, res) => {
    const token = parseCookie(req, "infrakit_session");
    if (isValidSession(token)) return res.redirect(`${basePath}/home`);
    res.render("login", { basePath, error: null });
  });

  app.post(`${basePath}/login`, express_urlencoded_fallback(), (req, res) => {
    const ip = req.ip;

    if (isLoginRateLimited(ip)) {
      return res.status(429).render("login", {
        basePath,
        error: "Too many attempts. Try again in a minute.",
      });
    }

    const { username: inputUser, password: inputPass } = req.body || {};

    if (inputUser === username && inputPass === password) {
      const token = createSession();
      res.setHeader(
        "Set-Cookie",
        `infrakit_session=${token}; HttpOnly; Path=${basePath}; Max-Age=1800`,
      );
      return res.redirect(`${basePath}/home`);
    }

    recordLoginAttempt(ip);
    res
      .status(401)
      .render("login", { basePath, error: "Invalid credentials." });
  });

  app.get(`${basePath}/home`, requireAuth, (req, res) => {
    let blockedIps = [];
    try {
      const db = core.db();
      blockedIps = db
        .prepare(
          "SELECT ip, reason, blocked_at FROM ik_blocked_ips ORDER BY blocked_at DESC",
        )
        .all();
    } catch (e) {}

    res.render("dashboard", {
      basePath,
      packages: core.listPackages(),
      rotation: getRotationStatus(),
      blockedIps,
      tables: TABLE_REGISTRY,
    });
  });
  app.post(
    `${basePath}/unblock`,
    requireAuth,
    express_urlencoded_fallback(),
    (req, res) => {
      try {
        const shield = require("@infrakit/shield");
        shield.unblockIp(req.body.ip);
        res.redirect(`${basePath}/home`);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  );

  app.get(`${basePath}/stream`, requireAuth, (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const watchedEvents = [
      "rate_limit_exceeded",
      "ip_blocked",
      "suspicious_request",
      "breaker:opened",
      "breaker:half_open",
      "breaker:closed",
      "health_degraded",
      "queue:job_failed",
      "queue:job_completed",
      "fn:execution_completed",
      "fn:execution_failed",
      "cache:hit",
      "cache:miss",
      "package:registered",
    ];

    const listeners = watchedEvents.map((name) => {
      const handler = (payload) => {
        res.write(
          `event: event\ndata: ${JSON.stringify({ name, payload, timestamp: Date.now() })}\n\n`,
        );
      };
      core.bus.on(name, handler);
      return { name, handler };
    });

    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      listeners.forEach(({ name, handler }) => core.bus.off(name, handler));
    });
  });
  app.get(`${basePath}/tables`, requireAuth, (req, res) => {
    const db = core.db();
    const tables = TABLE_REGISTRY.map((t) => ({
      ...t,
      exists: tableExists(db, t.name),
      rowCount: tableExists(db, t.name)
        ? db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get().cnt
        : 0,
    }));
    res.render("tables-list", { basePath, tables });
  });

  app.get(`${basePath}/tables/:name`, requireAuth, (req, res) => {
    const tableConfig = TABLE_REGISTRY.find((t) => t.name === req.params.name);
    if (!tableConfig) return res.status(404).send("Unknown table");

    const db = core.db();
    if (!tableExists(db, tableConfig.name)) {
      return res.render("table-view", {
        basePath,
        tables: TABLE_REGISTRY,
        tableConfig,
        rows: [],
        columns: [],
        total: 0,
        totalPages: 1,
        page: 1,
        sortColumn: tableConfig.defaultSort,
        sortDir: "DESC",
        filters: {},
      });
    }

    const page = parseInt(req.query.page) || 1;
    const { sort, dir, ...filters } = req.query;

    const result = queryTable(db, tableConfig, {
      page,
      sortColumn: sort,
      sortDir: dir,
      filters,
    });

    res.render("table-view", {
      basePath,
      tables: TABLE_REGISTRY,
      tableConfig,
      ...result,
      filters,
    });
  });

  app.get(`${basePath}/logout`, (req, res) => {
    res.setHeader(
      "Set-Cookie",
      `infrakit_session=; HttpOnly; Path=${basePath}; Max-Age=0`,
    );
    res.redirect(basePath);
  });
}

// Minimal manual body parsing so dashboard doesn't force a hard dependency
// on body-parser/express.json being configured a specific way by the host
// app — login only ever needs two string fields, not a general JSON parser.
function express_urlencoded_fallback() {
  return (req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) return next(); // already parsed upstream
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      const params = new URLSearchParams(data);
      req.body = Object.fromEntries(params.entries());
      next();
    });
  };
}

module.exports = { init };
