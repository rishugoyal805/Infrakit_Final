const crypto = require("crypto");

const sessions = new Map(); // token -> expiresAt
const loginAttempts = new Map(); // ip -> [timestamps]

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 60 * 1000;

function isLoginRateLimited(ip) {
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  loginAttempts.set(ip, attempts);
  return attempts.length >= LOGIN_LIMIT;
}

function recordLoginAttempt(ip) {
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(Date.now());
  loginAttempts.set(ip, attempts);
}

function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValidSession(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function parseCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

module.exports = { isLoginRateLimited, recordLoginAttempt, createSession, isValidSession, parseCookie };