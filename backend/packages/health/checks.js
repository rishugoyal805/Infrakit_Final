function createHttpCheck(name, url, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;

  return {
    name,
    timeout: opts.timeout || 3000,
    fn: async () => {
      const start = Date.now();
      if (typeof fetchImpl !== "function") {
        throw new Error("fetch is not available — pass opts.fetchImpl");
      }
      const res = await fetchImpl(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return { latency: Date.now() - start };
    }
  };
}

function createMongoCheck(mongooseConnection, opts = {}) {
  return {
    name: opts.name || "mongodb",
    timeout: opts.timeout || 2000,
    fn: async () => {
      const start = Date.now();
      if (!mongooseConnection || !mongooseConnection.db) {
        throw new Error("invalid mongoose connection");
      }
      await mongooseConnection.db.admin().ping();
      return { latency: Date.now() - start };
    }
  };
}

function createRedisCheck(redisClient, opts = {}) {
  return {
    name: opts.name || "redis",
    timeout: opts.timeout || 1000,
    fn: async () => {
      const start = Date.now();
      if (!redisClient || typeof redisClient.ping !== "function") {
        throw new Error("invalid redis client");
      }
      await redisClient.ping();
      return { latency: Date.now() - start };
    }
  };
}

module.exports = { createHttpCheck, createMongoCheck, createRedisCheck };