import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { decryptSecret } from "../export/secretCrypto.js";

const router = Router();

/**
 * GET /auth/verify?project_id=X&return_to=Y
 * Step 2 of the dashboard-auth flow: the user's exported middleware
 * redirected here because it saw no token. This checks the visitor is
 * logged in *and* owns project X, then issues a short-lived JWT signed
 * with that project's own secret and redirects back to return_to.
 *
 * Nothing about return_to itself is ever trusted by the middleware — only
 * the JWT signature is. This route just decides WHETHER to hand one out.
 */
router.get("/verify", requireAuth, (req, res) => {
  const { project_id, return_to } = req.query;
  if (!project_id || !return_to) {
    return res.status(400).send("project_id and return_to are required");
  }

  const project = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(project_id, req.user.uid);
  if (!project) return res.status(403).send("You don't own this project.");
  if (!project.dashboard_secret_enc) {
    return res.status(400).send("This project has no dashboard export yet — export it first.");
  }

  const secret = decryptSecret(project.dashboard_secret_enc);
  const token = jwt.sign({ project_id: String(project.id) }, secret, { expiresIn: "5m" });

  const url = new URL(return_to);
  url.searchParams.set("token", token);
  res.redirect(url.toString());
});

/**
 * POST /auth/verify-token  { project_id, token }
 * Option (b) from the spec: server-to-server verification, for anyone who
 * wants instant remote revocation instead of local-only JWT checks. Not
 * wired into the generated middleware by default (spec picks (a) for v1),
 * but exposed here so it's a one-line swap later if needed.
 */
router.post("/verify-token", (req, res) => {
  const { project_id, token } = req.body || {};
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(project_id);
  if (!project || !project.dashboard_secret_enc) {
    return res.status(404).json({ valid: false });
  }
  try {
    const secret = decryptSecret(project.dashboard_secret_enc);
    const payload = jwt.verify(token, secret);
    return res.json({ valid: true, payload });
  } catch {
    return res.json({ valid: false });
  }
});

export default router;
