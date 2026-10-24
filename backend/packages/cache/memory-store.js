function createMemoryStore(options = {}) {
  const maxEntries = options.maxEntries || 100;
  const store = new Map();

  function evictOldestIfFull() {
    if (store.size < maxEntries) return;
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }

  function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key, value, ttlMs) {
    if (!store.has(key)) evictOldestIfFull();
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  function del(key) {
    store.delete(key);
  }

  function has(key) {
    return get(key) !== undefined;
  }

  function clear() {
    store.clear();
  }

  function size() {
    return store.size;
  }

  return { get, set, del, has, clear, size };
}

module.exports = { createMemoryStore };