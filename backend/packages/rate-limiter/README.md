# @infrakit/rate-limiter

Sliding-window token bucket rate limiter for Express. Works standalone or connected to `@infrakit/core`.

## Install

    npm install @infrakit/rate-limiter

## Functions

### `applyRateLimits(app, routeConfigs)`
Attaches a rate limiter to one or more routes on an Express app.

- `app` — your Express app instance
- `routeConfigs` — object mapping route paths to limiter options, e.g. `{ "/api": { capacity: 5, refillRate: 0.5 } }`. **Ignored if core is connected and `infrakit.config.js` has a `rateLimiter.routes` block — core's config wins outright.**

If `@infrakit/core` is detected, registers itself (`register('rate-limiter', ...)`) and pulls route config from `core.config().rateLimiter.routes` instead of the argument passed in.

### `tokenBucketLimiter(options)`
Lower-level function — returns a single Express middleware implementing one token bucket. Used internally by `applyRateLimits`; call directly if you want to build custom routing logic instead of the route-map convenience wrapper.

Options:
- `capacity` (number, required) — max tokens in the bucket
- `refillRate` (number, required) — tokens refilled per second
- `keyGenerator` (function, optional) — how to identify a client, defaults to `req.ip`
- `bucketTTL` (ms, default 10 min) — how long an idle bucket is kept before cleanup
- `cleanupInterval` (ms, default 5 min) — how often expired buckets are swept

## Behavior

- Rejects with `429` and a `Retry-After` header when a bucket is empty.
- Every rejection emits `rate_limit_exceeded` on `core.bus` (if core is present) — this is what `@infrakit/shield` listens for to detect brute-force patterns.
- If core is absent, rate limiting still works fully — just without the event emission.

## Events emitted

| Event | Payload | When |
|---|---|---|
| `rate_limit_exceeded` | `{ ip, route, count, key }` | A request is rejected (429) |

## Config (via `infrakit.config.js`)

```js
rateLimiter: {
  routes: {
    "/api": { capacity: 3, refillRate: 0.5 },
    "/other": { capacity: 3, refillRate: 0.5 }
  }
}
```