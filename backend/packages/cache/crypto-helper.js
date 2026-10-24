const crypto = require("crypto");

function deriveKey(secret) {
  return crypto.scryptSync(secret, "infrakit-cache-salt", 32);
}

function encrypt(value, secret) {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const json = JSON.stringify(value);
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    __encrypted: true,
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
    authTag: authTag.toString("hex")
  };
}

function decrypt(payload, secret) {
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "hex"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "hex")),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

module.exports = { encrypt, decrypt };