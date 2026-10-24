import jwt from "jsonwebtoken";

const SECRET = process.env.PLATFORM_JWT_SECRET;
if (!SECRET) {
  throw new Error("PLATFORM_JWT_SECRET is not set — refusing to start with an unsigned session.");
}

export function signSession(user) {
  return jwt.sign({ uid: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
}

// Short-lived "step-up" proof for sensitive actions (viewing a dashboard
// access key, resetting its password) — separate from the 7-day login
// session so a stolen/left-open browser tab isn't enough on its own; the
// person has to re-prove their platform password within the last 15
// minutes. Deliberately NOT a blanket re-login on every click — that's
// friction without much added security once someone's already
// authenticated for this window.
export function signReauth(user) {
  return jwt.sign({ uid: user.id, stepUp: true }, SECRET, { expiresIn: "15m" });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.ike_session;
  if (!token) return res.status(401).json({ error: "not_authenticated" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid_session" });
  }
}

// Must run AFTER requireAuth — req.user is required.
export function requireReauth(req, res, next) {
  const token = req.cookies?.ike_reauth;
  if (!token) return res.status(403).json({ error: "reauth_required" });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.uid !== req.user.uid || !payload.stepUp) {
      return res.status(403).json({ error: "reauth_required" });
    }
    next();
  } catch {
    return res.status(403).json({ error: "reauth_required" });
  }
}
