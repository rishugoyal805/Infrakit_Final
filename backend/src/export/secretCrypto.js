import crypto from "crypto";

// Platform-held master key, distinct from PLATFORM_JWT_SECRET (which signs
// login sessions) and from any per-project secret. Must be 32 bytes; store
// as a 64-char hex string in .env. Generate with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const KEY_HEX = process.env.SECRET_ENCRYPTION_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error(
    "SECRET_ENCRYPTION_KEY must be a 64-char hex string (32 bytes) — used to encrypt per-project dashboard secrets at rest."
  );
}
const KEY = Buffer.from(KEY_HEX, "hex");

export function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(stored) {
  const raw = Buffer.from(stored, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
