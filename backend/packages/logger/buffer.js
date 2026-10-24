function createWriteBuffer(getDb, options = {}) {
  const maxBuffer = options.maxBufferSize || 100;
  const flushIntervalMs = options.flushIntervalMs || 500;

  let buffer = [];
  let droppedCount = 0;

  function push(entry) {
    if (buffer.length >= maxBuffer) {
      buffer.shift();
      droppedCount++;
    }
    buffer.push(entry);
  }

  function flush() {
    if (buffer.length === 0) return;
    const db = getDb();
    const toWrite = buffer;
    buffer = [];

    const insert = db.prepare(`
      INSERT INTO ik_logs (timestamp, level, method, route, ip, status, latency_ms, user_agent, message, meta)
      VALUES (@timestamp, @level, @method, @route, @ip, @status, @latency_ms, @user_agent, @message, @meta)
    `);

    const insertMany = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });

    try {
      insertMany(toWrite);
    } catch (e) {
      console.error("[infrakit/logger] flush failed:", e.message);
    }
  }

  function getDroppedCount() {
    return droppedCount;
  }

  const interval = setInterval(flush, flushIntervalMs);
  if (typeof interval.unref === "function") interval.unref();

  process.on("SIGTERM", () => {
    flush();
  });

  return { push, flush, getDroppedCount };
}

module.exports = { createWriteBuffer };