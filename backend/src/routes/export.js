import { Router } from "express";
import bcrypt from "bcrypt";
import { cryptoRandomStringAsync } from "crypto-random-string";
import archiver from "archiver";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { extractNodesAndFlags, buildExportFiles } from "../export/buildExportFiles.js";
import { generateInfrakitConfig } from "../export/generateConfig.js";
import { generateSetupSnippet } from "../export/generateSetup.js";
import { generateDashboardLoginRouter } from "../export/generateDashboardLogin.js";
import { generateDashboardAuthCheckMiddleware } from "../export/generateDashboardAuthCheck.js";
import { generateReadme } from "../export/generateReadme.js";

const router = Router();
router.use(requireAuth);

// GET /api/projects/:id/export/preview
// Read-only. Lets the webapp show exactly what will be in the export
// before the user commits to downloading it.
router.get("/:id/export/preview", (req, res) => {
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.uid);
  if (!row) return res.status(404).json({ error: "not found" });

  const graph = JSON.parse(row.graph_json);
  const { nodes, edges, dashboardEnabled } = extractNodesAndFlags(graph);
  const files = buildExportFiles(nodes, edges, dashboardEnabled);

  if (dashboardEnabled) {
    files.push({
      name: ".env.infrakit-secrets",
      content:
        "# Actual keys and passwords are generated only when you click\n" +
        "# \"Download ZIP\" below — not shown here, so previewing this export\n" +
        "# never rotates or exposes a live credential.",
    });
  }

  res.json({ files, dashboardEnabled });
});

// POST /api/projects/:id/export
// router.post("/:id/export", async (req, res) => {
//   const row = db
//     .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
//     .get(req.params.id, req.user.uid);
//   if (!row) return res.status(404).json({ error: "not found" });

//   const graph = JSON.parse(row.graph_json);
//   const allNodes = graph.nodes || [];
//   const edges = graph.edges || [];

//   const dashboardEnabled =
//     !!graph.settings?.dashboardEnabled ||
//     allNodes.some((n) => n.data?.kind === "infrakit" && n.data?.pkgType === "dashboard");

//   const nodes = allNodes
//     .filter(
//       (n) =>
//         n.data?.kind === "infrakit" &&
//         n.data?.pkgType &&
//         n.data.pkgType !== "dashboard" &&
//         n.data.pkgType !== "core"
//     )
//     .map((n) => ({ id: n.id, type: n.data.pkgType, nickname: n.data.nickname, values: n.data.values }));

//   const configJs = generateInfrakitConfig(nodes, dashboardEnabled);
//   const setupJs = generateSetupSnippet(nodes, edges, dashboardEnabled);
//   const readmeMd = generateReadme(nodes, dashboardEnabled);

//   res.setHeader("Content-Type", "application/zip");
//   res.setHeader("Content-Disposition", `attachment; filename="infrakit-export-${row.id}.zip"`);
//   const archive = archiver("zip");
//   archive.pipe(res);
//   archive.append(configJs, { name: "infrakit.config.js" });
//   archive.append(setupJs, { name: "setup-infrakit.js" });
//   archive.append(readmeMd, { name: "README-infrakit.md" });

//   if (dashboardEnabled) {
//     // Access key: stable identifier, generated once and reused across
//     // exports (like a client ID — rotating it on every export would break
//     // any deployed instance's already-configured .env for no reason).
//     let accessKey = row.dashboard_access_key;
//     if (!accessKey) {
//       accessKey = "pk_" + (await cryptoRandomStringAsync({ length: 24, type: "url-safe" }));
//     }

//     // Access password: generated ONCE, then left alone — not rotated on
//     // every export anymore. It's bcrypt-hashed at rest, so after this
//     // first generation the plaintext genuinely doesn't exist anywhere on
//     // our side; re-exporting can't show it again. If you need it again
//     // later, reset it from the project's Dashboard Access panel — that's
//     // the only way, by design (see routes/projects.js's reset-password
//     // endpoint for why a true one-way hash was chosen over something
//     // recoverable).
//     let accessPasswordPlaintext = null; // only non-null when freshly generated THIS export
//     if (!row.dashboard_access_password_hash) {
//       accessPasswordPlaintext = await cryptoRandomStringAsync({ length: 20, type: "alphanumeric" });
//       const accessPasswordHash = await bcrypt.hash(accessPasswordPlaintext, 12);
//       db.prepare(
//         `UPDATE projects
//          SET dashboard_access_key = ?,
//              dashboard_access_password_hash = ?,
//              dashboard_access_password_created_at = datetime('now')
//          WHERE id = ?`
//       ).run(accessKey, accessPasswordHash, row.id);
//     } else if (!row.dashboard_access_key) {
//       // Password already exists but somehow no key (shouldn't normally
//       // happen — defensive only) — persist the key without touching the
//       // existing password hash.
//       db.prepare(`UPDATE projects SET dashboard_access_key = ? WHERE id = ?`).run(accessKey, row.id);
//     }

//     // Dashboard's own real login (relayed internally — the operator using
//     // the access key/password above never needs to see these). This one
//     // still rotates freely every export — nobody has to remember it, the
//     // login relay always reads whatever's currently in .env.
//     const dashboardPassword = await cryptoRandomStringAsync({ length: 20, type: "alphanumeric" });

//     const loginRouterJs = generateDashboardLoginRouter({
//       platformOrigin: process.env.PLATFORM_ORIGIN || "http://localhost:4000",
//       dashboardBasePath: "/infrakit", // matches the real package's default — see generateDashboardLogin.js's comment if you customize dashboard.basePath
//     });
//     archive.append(loginRouterJs, { name: "infrakit-dashboard-login.js" });

//     const authCheckJs = generateDashboardAuthCheckMiddleware({
//       platformOrigin: process.env.PLATFORM_ORIGIN || "http://localhost:4000",
//       dashboardBasePath: "/infrakit",
//     });
//     archive.append(authCheckJs, { name: "infrakit-dashboard-auth-check.js" });

//     const envLines = [
//       `DASHBOARD_ACCESS_KEY=${accessKey}`,
//       accessPasswordPlaintext
//         ? `DASHBOARD_ACCESS_PASSWORD=${accessPasswordPlaintext}`
//         : `# DASHBOARD_ACCESS_PASSWORD is unchanged since it was first generated — this export` +
//           `\n# can't include it again (it's stored as a one-way hash, not recoverable). If your` +
//           `\n# .env already has it from a previous export, leave that line as-is. Lost it? Reset` +
//           `\n# it from this project's Dashboard Access panel — that generates a new one.`,
//       `DASHBOARD_USERNAME=admin`,
//       `DASHBOARD_PASSWORD=${dashboardPassword}`,
//       ``,
//     ];
//     archive.append(envLines.join("\n"), { name: ".env.infrakit-secrets" });
//   }

//   await archive.finalize();
// });

router.post("/:id/export", async (req, res) => {
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.uid);
  if (!row) return res.status(404).json({ error: "not found" });

  const graph = JSON.parse(row.graph_json);
  const { nodes, edges, dashboardEnabled } = extractNodesAndFlags(graph);
  const files = buildExportFiles(nodes, edges, dashboardEnabled);

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="infrakit-export-${row.id}.zip"`);
  const archive = archiver("zip");
  archive.pipe(res);
  for (const f of files) archive.append(f.content, { name: f.name });

  if (dashboardEnabled) {
    // Access key: stable identifier, generated once and reused across
    // exports (like a client ID — rotating it on every export would break
    // any deployed instance's already-configured .env for no reason).
    let accessKey = row.dashboard_access_key;
    if (!accessKey) {
      accessKey = "pk_" + (await cryptoRandomStringAsync({ length: 24, type: "url-safe" }));
    }

    // Access password: generated ONCE, then left alone — not rotated on
    // every export anymore. It's bcrypt-hashed at rest, so after this
    // first generation the plaintext genuinely doesn't exist anywhere on
    // our side; re-exporting can't show it again.
    let accessPasswordPlaintext = null;
    if (!row.dashboard_access_password_hash) {
      accessPasswordPlaintext = await cryptoRandomStringAsync({ length: 20, type: "alphanumeric" });
      const accessPasswordHash = await bcrypt.hash(accessPasswordPlaintext, 12);
      db.prepare(
        `UPDATE projects
         SET dashboard_access_key = ?,
             dashboard_access_password_hash = ?,
             dashboard_access_password_created_at = datetime('now')
         WHERE id = ?`
      ).run(accessKey, accessPasswordHash, row.id);
    } else if (!row.dashboard_access_key) {
      db.prepare(`UPDATE projects SET dashboard_access_key = ? WHERE id = ?`).run(accessKey, row.id);
    }

    const dashboardPassword = await cryptoRandomStringAsync({ length: 20, type: "alphanumeric" });

    const envLines = [
      `DASHBOARD_ACCESS_KEY=${accessKey}`,
      accessPasswordPlaintext
        ? `DASHBOARD_ACCESS_PASSWORD=${accessPasswordPlaintext}`
        : `# DASHBOARD_ACCESS_PASSWORD is unchanged since it was first generated — this export` +
          `\n# can't include it again (it's stored as a one-way hash, not recoverable). If your` +
          `\n# .env already has it from a previous export, leave that line as-is. Lost it? Reset` +
          `\n# it from this project's Dashboard Access panel — that generates a new one.`,
      `DASHBOARD_USERNAME=admin`,
      `DASHBOARD_PASSWORD=${dashboardPassword}`,
      ``,
    ];
    archive.append(envLines.join("\n"), { name: ".env.infrakit-secrets" });
  }

  await archive.finalize();
});

export default router;
