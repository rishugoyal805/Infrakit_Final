import { PACKAGE_CATALOG } from "./packageCatalog.js";
import { topoSort } from "./topoSort.js";

function varName(type) {
  return type.replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Builds the config-reference expression passed into a wiring call.
 * Almost every package's own config block IS the options object its
 * init()/apply() function expects — but @infrakit/rate-limiter is the one
 * exception: applyRateLimits(app, routeConfigs) expects the ROUTES MAP
 * directly (checked against the real applyRateLimits.js source), not the
 * { routes: {...} } wrapper that lives at config.rateLimiter. Special-cased
 * here rather than left to the (usually-masking, not-always-present) fact
 * that the package re-reads the correct value itself when core is
 * connected — this needs to be right in the no-core / standalone case too.
 */
function buildConfigRef(type, baseExpr) {
  if (type === "rate-limiter") return `(${baseExpr} || {}).routes || {}`;
  return `${baseExpr} || {}`;
}

/** One node's real wiring call — see packageCatalog.js's wireKind comments for why these differ per package. */
function wireLines(type, configRef) {
  const v = varName(type);
  switch (PACKAGE_CATALOG[type].wireKind) {
    case "require-only":
      return [];
    case "apply-rate-limits":
      return [`applyRateLimits(app, ${configRef});`];
    case "init-app":
      return [`${v}.init(app, ${configRef});`];
    case "init-then-middleware":
      return [`${v}.init(${configRef});`, `app.use(${v}.middleware());`];
    case "init-only":
      return [
        `${v}.init(${configRef});`,
        `// ${type} has no middleware to mount — call its API where you need it` +
          (type === "cache"
            ? ` (e.g. app.get("/path", ${v}.route(60000), handler)).`
            : type === "breaker"
            ? ` (e.g. await ${v}.execute("service-name", async () => { ... })).`
            : ` (e.g. ${v}.process("name", handler) / ${v}.add("name", payload)).`),
      ];
    default:
      return [`// TODO: unrecognized wireKind for ${type}`];
  }
}

/**
 * nodes: [{ id, type, nickname, values }], edges: [{ source, target }],
 * dashboardEnabled: boolean (dashboard is a project-level checkbox now, not
 * a node — so it's threaded through as a parameter, and `core` is only
 * required at all when this is true, since dashboard is the one real
 * package in this catalog with a hard core dependency).
 *
 * "smart-stick-loadbalancer" is excluded from the main app.use()-style
 * chain — it's a standalone reverse-proxy process, not middleware — and
 * gets its own commented snippet per instance instead.
 */
export function generateSetupSnippet(nodes, edges, dashboardEnabled) {
  const order = topoSort(nodes, edges);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const orderedNodes = order.map((id) => byId.get(id)).filter(Boolean);

  const typeOrder = [];
  const instancesByType = new Map();
  for (const n of orderedNodes) {
    if (!instancesByType.has(n.type)) {
      instancesByType.set(n.type, []);
      typeOrder.push(n.type);
    }
    instancesByType.get(n.type).push(n);
  }

  const requireTypes = dashboardEnabled ? ["core", ...typeOrder, "dashboard"] : typeOrder;
  const requireLines = requireTypes
    .map((t) => {
      const pkg = PACKAGE_CATALOG[t];
      if (t === "rate-limiter") return `const { applyRateLimits } = require("${pkg.npmName}");`;
      return `const ${varName(t)} = require("${pkg.npmName}");`;
    })
    .join("\n");

  const wiringBlocks = [];
  for (const type of typeOrder) {
    if (type === "loadbalancer") continue; // handled separately below — not middleware
    const instances = instancesByType.get(type);
    const cfgKey = PACKAGE_CATALOG[type].configKey;

    if (instances.length === 1) {
      const ref = cfgKey ? buildConfigRef(type, `config.${cfgKey}`) : "{}";
      wiringBlocks.push(`// --- ${type} ---`, ...wireLines(type, ref));
    } else {
      wiringBlocks.push(`// --- ${type} (${instances.length} instances — see NOTE in infrakit.config.js) ---`);
      instances.forEach((inst) => {
        const nickname = inst.nickname?.trim() || type;
        const ref = cfgKey ? buildConfigRef(type, `config.${cfgKey}[${JSON.stringify(nickname)}]`) : "{}";
        wiringBlocks.push(`// instance: ${nickname}`, ...wireLines(type, ref));
      });
    }
  }

  if (dashboardEnabled) {
    wiringBlocks.push(
      `// --- dashboard access (continuous revocation check) ---`,
      `// Mounted BEFORE dashboard.init() so it gates every dashboard route,`,
      `// not just /login — this is what lets the platform revoke access later.`,
      `app.use("/infrakit", require("./infrakit-dashboard-auth-check.js"));`
    );
    wiringBlocks.push(`// --- dashboard ---`, ...wireLines("dashboard", "config.dashboard || {}"));
    wiringBlocks.push(
      `// --- dashboard access (project key + password login) ---`,
      `// Factory function, not a plain router — it needs the same "app" instance`,
      `// to relay a real login into dashboard. See that file's header for why.`,
      `app.use("/infrakit-access", require("./infrakit-dashboard-login.js")(app));`
    );
  }

  const lbInstances = instancesByType.get("loadbalancer") || [];
  const lbSnippet = lbInstances.length
    ? `

// ============================================================================
// smart-stick-loadbalancer — run as its own process (e.g. setup-loadbalancer.js),
// NOT inside the same app.use() chain above. It proxies to backend URLs you
// configure in infrakit.config.js's loadBalancer block.
// ============================================================================
${lbInstances
  .map((inst) => {
    const nickname = inst.nickname?.trim() || "loadbalancer";
    const ref = lbInstances.length === 1 ? "config.loadBalancer" : `config.loadBalancer[${JSON.stringify(nickname)}]`;
    return `// instance: ${nickname}\n// const { createStickyProxy } = require("smart-stick-loadbalancer");\n// const config = require("./infrakit.config.js");\n// const lb = createStickyProxy(${ref});\n// lb.start();`;
  })
  .join("\n\n")}
`
    : "";

  return `// Generated by InfraKit Visual Editor.
// require() and wiring order below follows the arrows you drew on the
// canvas (topologically sorted). Nodes with no incoming edge run first.
// Each package's wiring call matches its real exported API. "core" is only
// required at all when the dashboard is enabled (the only package in this
// catalog with a hard runtime dependency on it).
const express = require("express");
const config = require("./infrakit.config.js");

${requireLines}

const app = express();

${wiringBlocks.join("\n")}

module.exports = app;
${lbSnippet}`;
}
