import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "../db.js";
import { signSession, signReauth, requireAuth } from "../middleware/auth.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const REAUTH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 15 * 60 * 1000,
};

router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: "email and an 8+ char password are required" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "email already registered" });

  const hash = await bcrypt.hash(password, 12);
  const info = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, hash);
  const user = { id: info.lastInsertRowid, email };
  res.cookie("ike_session", signSession(user), COOKIE_OPTS);
  res.status(201).json({ user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row) return res.status(401).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(password || "", row.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  const user = { id: row.id, email: row.email };
  res.cookie("ike_session", signSession(user), COOKIE_OPTS);
  res.json({ user });
});

router.post("/logout", (req, res) => {
  res.clearCookie("ike_session");
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.uid, email: req.user.email } });
});

// Step-up confirmation for sensitive project actions (viewing a dashboard
// access key, resetting its password) — re-checks the platform password,
// not a new credential. Valid for 15 minutes per signReauth().
router.post("/reauth", requireAuth, async (req, res) => {
  const { password } = req.body || {};
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.uid);
  if (!row) return res.status(401).json({ error: "invalid_session" });
  const ok = await bcrypt.compare(password || "", row.password_hash);
  if (!ok) return res.status(401).json({ error: "wrong_password" });
  res.cookie("ike_reauth", signReauth({ id: req.user.uid }), REAUTH_COOKIE_OPTS);
  res.json({ ok: true, expiresInMs: REAUTH_COOKIE_OPTS.maxAge });
});

export default router;
