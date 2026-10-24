# @infrakit/fn

Lambda-style event-driven function execution, running inside your own Node process — no cold starts, no per-invocation billing, no separate infrastructure. Works standalone or connected to `@infrakit/core`.

## Install
    npm install @infrakit/fn

## Functions

### `init(app, options)`
Must be called before any `register()` call. `app` is your Express app (required if you'll register any `http:` triggers — pass `null` if you only use `queue:`/`cron:` triggers). `options`: `{ rotationThreshold }`. Ignored if core is connected and `infrakit.config.js` has an `fn` block.

### `register(name, { trigger, timeout, handler })`
Registers a function against a trigger. Must be called **after** `init()`.

- `trigger` — one of three formats:
  - `"http:METHOD:/path"` — e.g. `"http:POST:/webhook"`. Mounts a real Express route.
  - `"queue:queueName"` — fires when a job is added to that `@infrakit/queue` queue. Requires `@infrakit/queue` to also be installed.
  - `"cron:expression"` — standard 5-field cron (`minute hour day month weekday`). **Only `*` and comma-separated exact values are supported** — no ranges (`1-5`) or steps (`*/15`). Checked every 15 seconds, deduplicated so a matching minute only fires once.
- `timeout` — ms, defaults to 5000. Handler is raced against this; exceeding it counts as a `timeout` status, not `error`.
- `handler` — `async (payload) => result`. For HTTP triggers, `payload` is `req.body`; the returned value becomes the JSON response. For queue triggers, the return value is passed back to queue's own result storage.

### `runFn(name, payload, triggerInfo)`
Lower-level — runs a registered function directly and returns `{ success, result }` or `{ success: false, error, status }`, without needing a real trigger to fire it. Exposed mainly for testing.

## Execution logging

Every execution — regardless of trigger type or outcome — is logged to `ik_fn_executions`: function name, trigger type/source, duration, status (`success`/`timeout`/`error`), and error message if applicable. Silently rotated at 100 rows (oldest dropped first) — this history is observational, not critical, same tier as successful queue jobs.

## Queue trigger behavior
If a queue-triggered function's handler throws, the error is re-thrown to `@infrakit/queue`'s own worker — meaning **queue's retry/backoff mechanism handles retries**, not `fn` itself. `fn` only logs each individual attempt; it doesn't duplicate queue's reliability logic.

## Circular triggers
Not proactively prevented — same behavior AWS Lambda adopts. If function A's trigger causes function B to fire, which in turn re-triggers A, that's the developer's responsibility to avoid. `fn` does not run cycle detection.

## Events (core-connected only)

| Event | Payload |
|---|---|
| `fn:execution_completed` | `{ name, trigger, durationMs }` |
| `fn:execution_failed` | `{ name, trigger, error, status }` |

## Config (`infrakit.config.js`)
```js
fn: {
  rotationThreshold: 100
}
```

## Known limitations
- Cron parser supports only `*` and exact comma-separated values — no ranges or step syntax. A more complex schedule needs a real cron library.
- `register()` must be called after `init()` — registrations before init throw immediately.