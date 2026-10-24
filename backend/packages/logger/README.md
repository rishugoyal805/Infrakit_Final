# @infrakit/logger

Buffered structured request/event logging. Batches writes so logging never adds meaningful latency to a request.

## Install

    npm install @infrakit/logger

## Functions

### `init(app)`
Registers with core (if present) and attaches the request-logging middleware to the given Express app. Call once at startup.

### `middleware`
The Express middleware itself, in case you want to mount it manually instead of via `init(app)`. Logs method, route, IP, status code, latency, and user agent for every request — written **after** the response is already sent (via `res.on('finish')`), so logging never delays the client.

### `log.info(message, meta)`
### `log.warn(message, meta)`
### `log.error(message, meta)`
Manual structured logging, independent of HTTP requests. `meta` is any JSON-serializable object.

### `getDroppedCount()`
Returns how many log entries have been dropped due to buffer overflow (buffer caps at 100 entries; oldest is dropped first if the flush interval can't keep up). Useful for a monitoring dashboard.

## How the write buffer works

Every log entry is pushed to an in-memory array — no database call happens on the request path. Every 500ms, a background timer batch-inserts everything buffered into SQLite in one transaction, then clears the buffer. On process shutdown (`SIGTERM`), the buffer is flushed synchronously before exit. This is why logging adds effectively zero latency regardless of traffic volume.

## Storage

- Connected to core: writes to `core.db()`'s shared SQLite file, table `ik_logs`.
- Standalone: writes to its own `infrakit-logger.db` file, same table name.

## Events emitted

| Event | Payload | When |
|---|---|---|
| `logger:entry_written` | `{ method, route, status, latency_ms }` | After each request-log entry is pushed to the buffer |

## Known limitations
- Log rotation / archival at scale (spec'd threshold: 1000 rows) is not yet implemented.