import { PACKAGE_CATALOG } from "./packageCatalog.js";
import { generateInfrakitConfig } from "./generateConfig.js";
import { generateSetupSnippet } from "./generateSetup.js";
import { generateReadme } from "./generateReadme.js";
import { generateDashboardLoginRouter } from "./generateDashboardLogin.js";
import { generateDashboardAuthCheckMiddleware } from "./generateDashboardAuthCheck.js";

/**
 * Reads a saved project's graph into the same {nodes, edges, dashboardEnabled}
 * shape the generators expect. Pure — no DB access.
 */
export function extractNodesAndFlags(graph) {
  const allNodes = graph.nodes || [];
  const edges = graph.edges || [];

  const dashboardEnabled =
    !!graph.settings?.dashboardEnabled ||
    allNodes.some((n) => n.data?.kind === "infrakit" && n.data?.pkgType === "dashboard");

  const nodes = allNodes
    .filter(
      (n) =>
        n.data?.kind === "infrakit" &&
        n.data?.pkgType &&
        n.data.pkgType !== "dashboard" &&
        n.data.pkgType !== "core" && 
        PACKAGE_CATALOG[n.data.pkgType]
    )
    .map((n) => ({ id: n.id, type: n.data.pkgType, nickname: n.data.nickname, values: n.data.values }));

  return { nodes, edges, dashboardEnabled };
}

/**
 * Builds every generated file EXCEPT .env.infrakit-secrets (that one needs
 * a DB-backed access key/password, which has real side effects — see
 * routes/export.js). Pure and safe to call as many times as you like,
 * which is what makes it safe to reuse for a read-only preview.
 */
export function buildExportFiles(nodes, edges, dashboardEnabled, { platformOrigin } = {}) {
  const files = [
    { name: "infrakit.config.js", content: generateInfrakitConfig(nodes, dashboardEnabled) },
    { name: "setup-infrakit.js", content: generateSetupSnippet(nodes, edges, dashboardEnabled) },
    { name: "README-infrakit.md", content: generateReadme(nodes, dashboardEnabled) },
  ];

  if (dashboardEnabled) {
    const origin = platformOrigin || process.env.PLATFORM_ORIGIN || "http://localhost:4000";
    files.push(
      {
        name: "infrakit-dashboard-login.js",
        content: generateDashboardLoginRouter({ platformOrigin: origin, dashboardBasePath: "/infrakit" }),
      },
      {
        name: "infrakit-dashboard-auth-check.js",
        content: generateDashboardAuthCheckMiddleware({ platformOrigin: origin, dashboardBasePath: "/infrakit" }),
      }
    );
  }

  return files;
}