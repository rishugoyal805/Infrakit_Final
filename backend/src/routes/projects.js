import { Router } from "express";
import bcrypt from "bcrypt";
import { cryptoRandomStringAsync } from "crypto-random-string";
import { db } from "../db.js";
import { requireAuth, requireReauth } from "../middleware/auth.js";
import { PACKAGE_CATALOG } from "../export/packageCatalog.js";

const router = Router();
router.use(requireAuth);

router.get("/catalog", (req, res) => {
  // Frontend fetches this instead of hardcoding a second copy of defaults.
  res.json({ catalog: PACKAGE_CATALOG });
});

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT id, name, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC")
    .all(req.user.uid);
  res.json({ projects: rows });
});

router.post("/", (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });
  const info = db
    .prepare("INSERT INTO projects (user_id, name) VALUES (?, ?)")
    .run(req.user.uid, name);
  res.status(201).json({ id: info.lastInsertRowid, name });
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.uid);
  if (!row) return res.status(404).json({ error: "not found" });
  // Never send dashboard_secret_enc (reversible) or dashboard_access_password_hash
  // to the client — this route returns everything else about the project.
  const { dashboard_secret_enc, dashboard_access_password_hash, ...safe } = row;
  res.json({ project: { ...safe, graph: JSON.parse(row.graph_json) } });
});

router.put("/:id", (req, res) => {
  const { graph } = req.body || {};
  if (!graph) return res.status(400).json({ error: "graph is required" });
  const owned = db
    .prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.uid);
  if (!owned) return res.status(404).json({ error: "not found" });

  db.prepare(
    "UPDATE projects SET graph_json = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(JSON.stringify(graph), req.params.id);
  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(req.params.id, req.user.uid);
  res.json({ ok: true });
});

// --- Dashboard access credentials: viewing/resetting requires step-up ---
// (requireReauth — see middleware/auth.js) on top of normal ownership,
// since these gate access to whatever the exported app's dashboard shows.

router.get("/:id/dashboard-credentials", requireReauth, (req, res) => {
  const row = db
    .prepare(
      "SELECT dashboard_access_key, dashboard_access_password_hash, dashboard_access_password_created_at FROM projects WHERE id = ? AND user_id = ?"
    )
    .get(req.params.id, req.user.uid);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json({
    accessKey: row.dashboard_access_key || null,
    hasPassword: !!row.dashboard_access_password_hash,
    passwordCreatedAt: row.dashboard_access_password_created_at || null,
  });
});

// Generates a NEW password (old one stops working immediately) and returns
// the plaintext exactly once — bcrypt-hashed at rest, so this is the only
// moment it's ever recoverable, by us or anyone else. If a key doesn't
// exist yet for this project, one is generated here too (stable from then
// on — matches export.js's own "generate once, reuse" behavior).
router.post("/:id/dashboard-credentials/reset-password", requireReauth, async (req, res) => {
  const project = db.prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(req.params.id, req.user.uid);
  if (!project) return res.status(404).json({ error: "not found" });

  const accessKey = project.dashboard_access_key || "pk_" + (await cryptoRandomStringAsync({ length: 24, type: "url-safe" }));
  const plaintext = await cryptoRandomStringAsync({ length: 20, type: "alphanumeric" });
  const hash = await bcrypt.hash(plaintext, 12);

  db.prepare(
    `UPDATE projects
     SET dashboard_access_key = ?,
         dashboard_access_password_hash = ?,
         dashboard_access_password_created_at = datetime('now')
     WHERE id = ?`
  ).run(accessKey, hash, project.id);

  res.json({ accessKey, password: plaintext });
});

export default router;
