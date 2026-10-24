# @infrakit/cache

Ephemeral TTL cache — in-memory `Map` by default, optional Redis upgrade. No persistence, no SQLite — reset on restart is correct, expected behavior. Works standalone or connected to `@infrakit/core`.

## Install
    npm install @infrakit/cache

## Functions

### `init(options)`
`options`: `{ redisUrl, maxEntries, encryptByDefault, encryptionKey }`. Ignored if core is connected and `infrakit.config.js` has a `cache` block — core wins. If `encryptByDefault: true` is set without `encryptionKey`, `init()` throws immediately rather than failing silently later.

### `get(key)` / `set(key, value, ttlMs, options)` / `del(key)` / `has(key)`
All async, regardless of backend (memory or Redis), for a consistent API. `set()`'s `options.encrypt` (`true`/`false`) overrides `encryptByDefault` for that one call.

### `route(ttlMs)`
Express middleware. Caches GET responses keyed by full URL + query string. Sets `X-Cache: HIT` or `X-Cache: MISS` on the response. Non-GET requests pass through uncached.

## Backend selection
- `redisUrl` present (in config or `INFRAKIT_REDIS_URL` env var) → Redis-backed, requires `npm install ioredis`.
- Otherwise → in-memory `Map`, zero dependencies, capped at `maxEntries` (oldest evicted first).

## Encryption — opt-in, not automatic
Cache does not know what data is sensitive — that's the caller's responsibility, same as with any cache service (AWS ElastiCache, Redis, etc.). Pass `{ encrypt: true }` to `set()` for values that need it:
```js
await cache.set(`session:${userId}`, token, 300000, { encrypt: true });
const token = await cache.get(`session:${userId}`); // decrypts automatically
```
Encryption uses AES-256-GCM, keyed from `cache.encryptionKey` in config — **not** the general app `secret`, deliberately separate so rotating one doesn't affect the other. Only the *value* is encrypted; cache *keys* are always plaintext.

## Key collisions are the caller's responsibility
Cache has no concept of users or sessions — only keys. `cache.set("profile", data)` used for every user means every user shares one entry. Always namespace keys yourself: `cache.set(\`profile:${userId}\`, data)`.

## Events (core-connected only)

| Event | Payload |
|---|---|
| `cache:hit` | `{ key, route }` |
| `cache:miss` | `{ key, route }` |

## Config (`infrakit.config.js`)
```js
cache: {
  redisUrl: null,
  maxEntries: 100,
  encryptByDefault: false,
  encryptionKey: process.env.CACHE_ENCRYPTION_KEY
}
```

## Known limitations
- Expired entries are lazily removed (on next read attempt), not proactively swept — memory isn't reclaimed for expired-but-unread keys until something looks them up.
- Redis upgrade path is implemented but not yet tested end-to-end against a real Redis instance.