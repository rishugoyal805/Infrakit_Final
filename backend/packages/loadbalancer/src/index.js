const express = require("express");
const http = require("http");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cookieParser = require("cookie-parser");
const socketIo = require("socket.io");
const { startHealthChecker, resolveHealthConfig } = require("./healthChecker");
const { sendDownAlert, sendUpAlert } = require("./notifier");
const { buildWeightedPool, selectBackend } = require("./router");

function createStickyProxy(options = {}) {
  let core = null;
  let strategy = options.strategy || "round-robin";
  let healthOptionsOverride = options.health;
  let port = options.port;
  let backends = options.backends;
  let emailOptions = options.email;

  try {
    core = require("@infrakit/core");
    const cfg = core.config();

    if (cfg.loadBalancer) {
      if (cfg.loadBalancer.strategy) strategy = cfg.loadBalancer.strategy;
      if (cfg.loadBalancer.health)
        healthOptionsOverride = cfg.loadBalancer.health;
      if (cfg.loadBalancer.port) port = cfg.loadBalancer.port;
      if (cfg.loadBalancer.backends) backends = cfg.loadBalancer.backends;
      if (cfg.loadBalancer.email) emailOptions = cfg.loadBalancer.email;
      console.log(
        "[smart-stick-loadbalancer] using config from infrakit.config.js",
      );
    }
  } catch (e) {
    console.log(
      "[smart-stick-loadbalancer] running standalone, no core detected:",
      e.message,
    );
  }

  // Validation happens AFTER config resolution, not before — port/backends
  // may come from infrakit.config.js instead of the options object, so
  // checking options.port directly (like the original code did) would
  // wrongly reject a call that's valid via central config.
  if (!port) {
    throw new Error(
      "[smart-stick-loadbalancer] 'port' is required — pass in options or infrakit.config.js loadBalancer.port.",
    );
  }
  if (!backends || !Array.isArray(backends) || backends.length === 0) {
    throw new Error(
      "[smart-stick-loadbalancer] 'backends' must be a non-empty array — pass in options or infrakit.config.js loadBalancer.backends.",
    );
  }

  const validStrategies = ["round-robin", "least-connections", "random"];
  if (!validStrategies.includes(strategy)) {
    throw new Error(
      `[smart-stick-loadbalancer] Unknown strategy '${strategy}'. Valid options: ${validStrategies.join(", ")}`,
    );
  }

  if (core) {
    core.register("load-balancer", { version: "1.1.4", strategy });
  }

  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);

  const servers = backends.map((b) => ({
    ...b,
    weight: b.weight ?? 1,
    healthy: true,
    requests: 0,
    activeConnections: 0,
    lastChecked: null,
  }));

  let weightedPool = buildWeightedPool(servers.filter((s) => s.healthy));
  let poolIndex = 0;

  function rebuildPool() {
    weightedPool = buildWeightedPool(servers.filter((s) => s.healthy));
    poolIndex = 0;
  }

  app.use(cookieParser());

  const healthConfig = healthOptionsOverride || {};
  app.get("/_lb/health", (req, res) => {
    res.json({
      timestamp: new Date().toISOString(),
      strategy,
      total: servers.length,
      healthy: servers.filter((s) => s.healthy).length,
      unhealthy: servers.filter((s) => !s.healthy).length,
      backends: servers.map((s) => {
        const resolved = resolveHealthConfig(s, healthConfig);
        return {
          id: s.id,
          url: s.url,
          healthy: s.healthy,
          weight: s.weight,
          requests: s.requests,
          activeConnections: s.activeConnections,
          lastChecked: s.lastChecked,
          healthCheck: {
            path: resolved.path,
            method: resolved.method,
            algorithm: resolved.algorithm,
            timeout: resolved.timeout,
            hasCustomHeaders: Object.keys(resolved.headers).length > 0,
            hasCustomFunction: typeof resolved.check === "function",
          },
        };
      }),
    });
  });

  function getHealthyBackend(req, res) {
    const healthyBackends = servers.filter((s) => s.healthy);
    if (!healthyBackends.length) return null;

    const cookieId = parseInt(req.cookies["X-Backend-ID"]);
    if (!isNaN(cookieId)) {
      const sticky = servers.find((s) => s.id === cookieId && s.healthy);
      if (sticky) return sticky;
    }

    const result = selectBackend(
      strategy,
      healthyBackends,
      weightedPool,
      poolIndex,
    );
    if (strategy === "round-robin") {
      poolIndex = result.nextIndex;
    }

    res.cookie("X-Backend-ID", result.backend.id, { httpOnly: true });
    return result.backend;
  }

  const proxies = new Map();
  servers.forEach((backend) => {
    proxies.set(
      backend.id,
      createProxyMiddleware({
        target: backend.url,
        changeOrigin: true,
        ws: true,
        on: {
          proxyRes(proxyRes, req, res) {
            if (!res.headersSent) {
              res.setHeader("x-backend", backend.url);
              res.setHeader("x-backend-id", backend.id);
            }
          },
          error(err, req, res) {
            backend.activeConnections = Math.max(
              0,
              backend.activeConnections - 1,
            );
            if (!res.headersSent) {
              res
                .status(502)
                .json({ error: "Bad gateway — backend did not respond." });
            }
          },
        },
      }),
    );
  });

  app.use((req, res, next) => {
    const backend = getHealthyBackend(req, res);
    if (!backend) {
      if (core) {
        core.bus.emit("lb:no_healthy_backends", {
          total: servers.length,
          strategy,
          route: req.originalUrl,
        });
      }
      return res.status(503).json({ error: "No healthy backends available." });
    }

    backend.requests++;
    backend.activeConnections++;

    res.on("finish", () => {
      backend.activeConnections = Math.max(0, backend.activeConnections - 1);
    });

    io.emit("request", {
      ip: req.ip,
      to: backend.url,
      backendId: backend.id,
      strategy,
    });

    const proxy = proxies.get(backend.id);
    proxy(req, res, next);
  });

  startHealthChecker(
    servers,
    healthOptionsOverride || { interval: 10000, timeout: 2000 },
    (server) => {
      rebuildPool();
      io.emit("update", servers);
      if (emailOptions) sendDownAlert(server, emailOptions);
      if (core)
        core.bus.emit("lb:backend_down", { id: server.id, url: server.url });
    },
    (server) => {
      rebuildPool();
      io.emit("update", servers);
      if (emailOptions) sendUpAlert(server, emailOptions);
      if (core)
        core.bus.emit("lb:backend_up", { id: server.id, url: server.url });
    },
  );

  function start() {
    server.listen(port, () =>
      console.log(
        `[smart-stick-loadbalancer] Running on port ${port} | strategy: ${strategy}`,
      ),
    );
  }

  return { app, server, io, start, servers };
}

module.exports = { createStickyProxy };
