# @infrakit/queue

SQLite-backed background job queue. Submit work, it runs asynchronously with retry, backoff, priority, and delayed execution. Works standalone or connected to `@infrakit/core`.

## Install
    npm install @infrakit/queue

## Functions

### `init(options)`
Starts the background worker (a single poller, regardless of how many queue names you use). `options` — `{ pollIntervalMs, batchSize, rotationThreshold, failedRotationThreshold }`. Ignored if core is connected and `infrakit.config.js` has a `queue` block — core wins.

### `add(queueName, payload, options)`
Submits a job. Returns a job ID immediately — **does not wait for or return the result**. `options`: `{ priority, delayMs, maxAttempts }`.

### `process(queueName, handlerFn)`
Registers the function that runs when a job on `queueName` is due. `handlerFn` receives the payload, may be async, its return value is stored and retrievable via `getJob()`.

### `getJob(id)`
Returns `{ id, queue, status, failed, attempts, maxAttempts, lastError, result, createdAt, updatedAt }` or `null` if the ID doesn't exist. Use this to check on or retrieve the result of a previously submitted job — e.g. from a status-polling endpoint.

### `getStats(queueName?)`
Returns `{ pending, done, failed }` counts, optionally filtered to one queue name.

## How it works

One shared poller checks for due jobs across **all** queue names every `pollIntervalMs`, ordered by priority then age. There is no separate poller per queue name — adding more named queues costs nothing extra.

There is no "processing" state — a job is `pending` for its entire execution. If the process crashes mid-job, it's still `pending` on restart and will run again. This is a known, documented trade-off, not yet solved (would need idempotency handling on the consumer side).

Failed jobs retry with exponential backoff (1s, 2s, 4s, 8s...) up to `maxAttempts`, then are marked `done` with `failed: true` — not a separate "failed" state.

## Events (core-connected only)

| Event | Payload |
|---|---|
| `queue:job_completed` | `{ id, queue, attempts }` |
| `queue:job_failed` | `{ id, queue, attempts, error }` |

## Config (`infrakit.config.js`)
```js
queue: {
  pollIntervalMs: 1000,
  batchSize: 5,
  rotationThreshold: 100,
  failedRotationThreshold: 1000
}
```

## Rotation
Successful jobs are silently deleted once they exceed `rotationThreshold` (default 100), oldest first. Failed jobs are kept much longer (`failedRotationThreshold`, default 1000) since they have diagnostic value.

## Known limitations
- Not a distributed message broker — one process, one queue table, one poller. Does not support multiple independent consumers across separate processes/services.
- No idempotency protection — see "processing state" note above.