function createRedisStore(redisUrl) {
  let Redis;
  try {
    Redis = require("ioredis");
  } catch (e) {
    throw new Error(
      "[infrakit/cache] Redis URI configured but 'ioredis' is not installed. Run: npm install ioredis"
    );
  }

  const client = new Redis(redisUrl);

  async function get(key) {
    const raw = await client.get(key);
    if (raw === null) return undefined;
    return JSON.parse(raw);
  }

  async function set(key, value, ttlMs) {
    await client.set(key, JSON.stringify(value), "PX", ttlMs);
  }

  async function del(key) {
    await client.del(key);
  }

  async function has(key) {
    const exists = await client.exists(key);
    return exists === 1;
  }

  async function clear() {
    await client.flushdb();
  }

  async function size() {
    return client.dbsize();
  }

  return { get, set, del, has, clear, size };
}

module.exports = { createRedisStore };