// Standalone usage — no @infrakit/core required.
// const cache = require('@infrakit/cache');
// cache.init(require('./example.config'));

module.exports = {
  redisUrl: null,           // null = in-memory. Set to a redis:// URI to upgrade.
  maxEntries: 100,          // memory mode only
  encryptByDefault: false,
  encryptionKey: process.env.CACHE_ENCRYPTION_KEY // only required if encryption is used
};