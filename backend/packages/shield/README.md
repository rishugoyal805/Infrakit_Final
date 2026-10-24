# @infrakit/shield

IP blocklisting, brute-force detection, and suspicious request pattern flagging. Listens for `@infrakit/rate-limiter`'s events when core is connected — packages coordinate without manual wiring.

## Install

    npm install @infrakit/shield

## Functions

### `init(app, options)`
Sets up shield — call once at app startup.

- `app` — Express app. Shield's middleware is attached automatically.
- `options` — `{ bruteForceThreshold, bruteForceWindowMs }`. **Ignored if core is connected and `infrakit.config.js` has a `shield` block.**

If core is present: registers itself, loads the existing IP blocklist from storage into memory, and subscribes to `rate_limit_exceeded` events from the bus to detect brute-force patterns across routes.

### `middleware` (also returned internally, mounted automatically by `init`)
Runs on every request:
1. Checks if the requester's IP is in the blocklist → `403` if so, request stops here.
2. Runs pattern inspection (SQL injection signatures, path traversal, oversized payload). If flagged, logs a `suspicious_request` event but does **not** block — single suspicious hits are logged only, not auto-blocked.

### `blockIp(ip, reason)`
Manually block an IP. Persists to storage and updates the in-memory cache immediately. Emits `ip_blocked` on the bus.

### `unblockIp(ip)`
Removes an IP from the blocklist, both in storage and the in-memory cache.

### `isBlocked(ip)`
Returns `true`/`false` — synchronous, checks the in-memory cache (not a DB query).

## How brute-force detection works

Shield tracks failed requests per IP across distinct routes. If the same IP triggers `rate_limit_exceeded` on **2 or more different routes** within the configured time window, shield calls `blockIp(ip, 'brute_force')` automatically. This only happens when core is present — standalone shield still blocks/flags via its own middleware, but has no visibility into rate-limiter's rejections without the shared event bus.

## Events

| Event | Direction | Payload |
|---|---|---|
| `rate_limit_exceeded` | listens | (from rate-limiter) |
| `ip_blocked` | emits | `{ ip, reason }` |
| `suspicious_request` | emits | `{ ip, route, reason }` |

## Config (via `infrakit.config.js`)

```js
shield: {
  bruteForceThreshold: 3,
  bruteForceWindowMs: 60000
}
```

## Known limitations
- Blocklist is cached in memory per-process — a block issued from a different process (e.g. a CLI tool) won't be seen until this process restarts.
- Blocked IPs never auto-expire — deliberate, matches spec. Use `unblockIp()` manually.
- Path traversal and oversized-payload detection use the same `inspectRequest` logic as SQL injection but have less test coverage.