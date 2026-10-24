import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "../db.js";

const router = Router();

// Simple in-memory rate limiter — same shape as @infrakit/dashboard's own
// login limiter (5 attempts / 60s per IP), reused here for the same reason:
// this is a public, unauthenticated, credential-guessing surface.
const attempts = new Map(); // ip -> timestamps[]
const LIMIT = 5;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, recent);
  return recent.length >= LIMIT;
}
function recordAttempt(ip) {
  const list = attempts.get(ip) || [];
  list.push(Date.now());
  attempts.set(ip, list);
}

/**
 * POST /auth/verify-credentials  { accessKey, password }
 *
 * Called server-to-server from a deployed InfraKit app's
 * infrakit-dashboard-login.js — NOT from a browser with a platform session
 * (unlike /auth/verify). This is what makes it work for an operator who
 * has server access to the deployed app but no shared browser session
 * with this platform.
 *
 * Deliberately public (no requireAuth): the caller is the exported app
 * itself, which was never logged into the platform as a user.
 */
router.post("/verify-credentials", async (req, res) => {
  const ip = req.ip;
  if (isRateLimited(ip)) {
    return res.status(429).json({ valid: false, error: "Too many attempts. Try again in a minute." });
  }

  const { accessKey, password } = req.body || {};
  if (!accessKey || !password) {
    return res.status(400).json({ valid: false, error: "accessKey and password are required" });
  }

  const project = db.prepare("SELECT * FROM projects WHERE dashboard_access_key = ?").get(accessKey);
  if (!project || !project.dashboard_access_password_hash) {
    recordAttempt(ip);
    return res.json({ valid: false });
  }

  const ok = await bcrypt.compare(password, project.dashboard_access_password_hash);
  if (!ok) {
    recordAttempt(ip);
    return res.json({ valid: false });
  }

  const graph = JSON.parse(project.graph_json || "{}");
  const packageCount = (graph.nodes || []).filter((n) => n.data?.kind === "infrakit").length;

  res.json({
    valid: true,
    project: {
      name: project.name,
      provider: graph.settings?.provider || "generic",
      packageCount,
      updatedAt: project.updated_at,
    },
  });
});

export default router;
