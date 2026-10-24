# @infrakit/core

Shared infrastructure layer for InfraKit packages — SQLite storage, an event bus, config loading, and package registry. Other InfraKit packages detect and use this automatically; you don't call most of this directly.

## Install

    npm install @infrakit/core

## What it provides

### `db()`
Returns a shared `better-sqlite3` database instance. Opens lazily on first call, not at `require` time. WAL mode enabled, integrity check runs on open. DB file (`infrakit.db`) is created next to the app's entry point file, not the current working directory — so it stays in the same place regardless of which folder you launch `node` from.

### `bus`
A shared `EventEmitter` singleton. Every package that does `require('@infrakit/core')` gets the same instance — this is what lets packages coordinate without being manually wired together. Use `core.bus.on(eventName, handler)` to listen, `core.bus.emit(eventName, payload)` to send.

### `config()`
Loads and returns config from `infrakit.config.js` (in the app's root, next to the entry point) merged with any `INFRAKIT_*` environment variables. Cached after first call — one load per process. Returns `{}` if no config file exists.

### `register(name, meta)`
Registers a package as active. `name` is a string, `meta` is an object (e.g. `{ version: '0.1.0' }`). Emits a `package:registered` event on the bus. Called automatically by each package's own `init()` — you don't need to call this yourself.

### `listPackages()`
Returns an array of everything currently registered via `register()`, each with a `registeredAt` timestamp.

## Events emitted

| Event | Payload | When |
|---|---|---|
| `package:registered` | `{ name, ...meta }` | Any package calls `register()` |

## Config shape (`infrakit.config.js`)

```js
module.exports = {
  secret: process.env.INFRAKIT_SECRET,
  shield: { /* see shield README */ },
  rateLimiter: { /* see rate-limiter README */ },
  loadBalancer: { /* see load-balancer README */ }
};
```

## Known limitations
- SQLCipher encryption not yet implemented — DB is currently unencrypted.
- No automatic backup/restore on corruption — integrity failures are logged, not recovered.