const crypto = require("crypto");
const { createMemoryStore } = require("./memory-store");
const { createRedisStore } = require("./redis-store");
const { encrypt, decrypt } = require("./crypto-helper");

let core = null;

try {
  core = require("@infrakit/core");
} catch (e) {
  console.log("[infrakit/cache] running standalone, no core detected:", e.message);
}

let store = null;
let cacheEncryptionKey = null;
let encryptByDefault = false;

function resolveStore(options = {}) {
  const redisUrl = options.redisUrl || process.env.INFRAKIT_REDIS_URL;
  if (redisUrl) {
    console.log("[infrakit/cache] Redis URI detected — using Redis-backed cache");
    return createRedisStore(redisUrl);
  }
  return createMemoryStore({ maxEntries: options.maxEntries || 100 });
}

function init(options = {}) {
  let effectiveOptions = options;

  if (core) {
    core.register("cache", { version: "0.1.0" });
    const cfg = core.config();
    if (cfg.cache) {
      effectiveOptions = cfg.cache;
      console.log("[cache] using config from infrakit.config.js");
    }
  }

  cacheEncryptionKey = effectiveOptions.encryptionKey || null;
  encryptByDefault = effectiveOptions.encryptByDefault || false;

  if (encryptByDefault && !cacheEncryptionKey) {
    throw new Error(
      "[infrakit/cache] encryptByDefault is true but no encryptionKey was provided. " +
      "Set cache.encryptionKey in infrakit.config.js (pull it from an env var — never hardcode it)."
    );
  }

  store = resolveStore(effectiveOptions);
}

async function get(key) {
  if (!store) throw new Error("[infrakit/cache] get() called before init()");
  const raw = await store.get(key);
  if (raw === undefined) return undefined;

  if (raw && raw.__encrypted) {
    if (!cacheEncryptionKey) {
      throw new Error(
        "[infrakit/cache] found an encrypted cache entry but no encryptionKey is configured to decrypt it."
      );
    }
    return decrypt(raw, cacheEncryptionKey);
  }
  return raw;
}

async function set(key, value, ttlMs = 60000, options = {}) {
  if (!store) throw new Error("[infrakit/cache] set() called before init()");

  const shouldEncrypt = options.encrypt !== undefined ? options.encrypt : encryptByDefault;

  let toStore = value;
  if (shouldEncrypt) {
    if (!cacheEncryptionKey) {
      throw new Error(
        "[infrakit/cache] encryption requested for this value but no encryptionKey is configured. " +
        "Set cache.encryptionKey in infrakit.config.js."
      );
    }
    toStore = encrypt(value, cacheEncryptionKey);
  }

  return store.set(key, toStore, ttlMs);
}

async function del(key) {
  if (!store) throw new Error("[infrakit/cache] del() called before init()");
  return store.del(key);
}

async function has(key) {
  if (!store) throw new Error("[infrakit/cache] has() called before init()");
  return store.has(key);
}

function hashRequest(req) {
  return crypto.createHash("md5").update(req.originalUrl).digest("hex");
}

function route(ttlMs = 60000) {
  return async function cacheMiddleware(req, res, next) {
    if (req.method !== "GET") return next();

    const cacheKey = `route:${hashRequest(req)}`;
    const cached = await get(cacheKey);

    if (cached !== undefined) {
      if (core) core.bus.emit("cache:hit", { key: cacheKey, route: req.originalUrl });
      res.set("X-Cache", "HIT");
      return res.status(cached.status).json(cached.body);
    }

    if (core) core.bus.emit("cache:miss", { key: cacheKey, route: req.originalUrl });

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      set(cacheKey, { status: res.statusCode, body }, ttlMs);
      res.set("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
}

module.exports = { init, get, set, del, has, route };