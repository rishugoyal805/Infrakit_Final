# @infrakit/breaker

Three-state circuit breaker (CLOSED → OPEN → HALF_OPEN) backed by SQLite, so state survives restarts and stays consistent across multiple instances sharing the same database. Works standalone or connected to `@infrakit/core`.

## Install
    npm install @infrakit/breaker

## Functions

### `init(options)`
`options`: `{ failureRateThreshold, minimumRequests, openTimeoutMs, successCountToClose }`. Ignored if core is connected and `infrakit.config.js` has a `breaker` block — core wins. These become the defaults for any `execute()` call that doesn't override them.

### `execute(name, fn, options?)`
Wraps a call with breaker protection. `name` identifies which breaker to use (one app can protect multiple independent things — a database, an external API, etc. — each with its own name and independent state). `fn` must be an async function. `options` can override the global defaults for this one call.

- If the breaker is CLOSED: calls `fn()` normally, tracks the result.
- If OPEN: rejects immediately with `BreakerOpenError`, **never calls `fn()`** — this is the "fail fast" behavior.
- If HALF_OPEN: allows exactly one probe call through; a second concurrent call is rejected fast rather than queued.

Real errors from `fn()` are never swallowed — if the wrapped function throws, `execute()` re-throws that same error to the caller (after recording the failure). `BreakerOpenError` is a distinct error type you can check for:
```js
try {
  await breaker.execute("payments-api", callPaymentsApi);
} catch (err) {
  if (err instanceof breaker.BreakerOpenError) {
    // circuit is open, don't retry immediately
  } else {
    // a real failure from the call itself
  }
}
```

### `getState(name)`
Returns the current row for a named breaker: `{ name, state, request_count, failure_count, success_count_in_half_open, probing, opened_at, updated_at }`, or `null` if that breaker has never been used.

## How the state machine works

- **CLOSED**: normal operation. Failures accumulate in a running count (not a time window — see limitation below). Once `request_count >= minimumRequests` AND `failure_count / request_count >= failureRateThreshold`, trips to OPEN.
- **OPEN**: every call rejected immediately without attempting. After `openTimeoutMs` has elapsed since opening, the *next* call triggers a transition to HALF_OPEN and is allowed through as the probe.
- **HALF_OPEN**: exactly one probe call allowed at a time. Success → increments a counter; once it reaches `successCountToClose`, transitions to CLOSED and resets all counts. Failure → immediately back to OPEN.

## Events (core-connected only)

| Event | Payload | When |
|---|---|---|
| `breaker:opened` | `{ name, error }` | Trips from CLOSED (or fails probe from HALF_OPEN) |
| `breaker:half_open` | `{ name }` | Timeout elapsed, probe allowed |
| `breaker:closed` | `{ name }` | Probe succeeded enough times |
| `breaker:rejected` | `{ name, state }` | A call was rejected without attempting (OPEN, or concurrent probe in HALF_OPEN) |

## Config (`infrakit.config.js`)
```js
breaker: {
  failureRateThreshold: 0.5,
  minimumRequests: 5,
  openTimeoutMs: 10000,
  successCountToClose: 2
}
```

## Known limitations
- Failure counting is a running total since the last CLOSED reset, not a true sliding time window — a breaker that stays CLOSED for a long time accumulates failure history indefinitely rather than only counting "recent" failures. Fine for most use cases; a high-precision production system might want time-boxed windows instead.