function getOrCreateBreaker(db, name) {
  let row = db.prepare("SELECT * FROM ik_circuit_breakers WHERE name = ?").get(name);
  if (!row) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO ik_circuit_breakers (name, state, request_count, failure_count, success_count_in_half_open, probing, updated_at)
      VALUES (?, 'CLOSED', 0, 0, 0, 0, ?)
    `).run(name, now);
    row = db.prepare("SELECT * FROM ik_circuit_breakers WHERE name = ?").get(name);
  }
  return row;
}

// Decides, BEFORE calling the wrapped function, whether the call is
// allowed to proceed — and performs the OPEN -> HALF_OPEN transition
// if the timeout has elapsed. Returns { allowed, breaker }.
function checkBeforeCall(db, name, options) {
  const breaker = getOrCreateBreaker(db, name);
  const now = Date.now();

  if (breaker.state === "CLOSED") {
    return { allowed: true, breaker };
  }

  if (breaker.state === "OPEN") {
    const elapsed = now - breaker.opened_at;
    if (elapsed >= options.openTimeoutMs) {
      // Timeout elapsed — move to HALF_OPEN, allow exactly one probe.
      db.prepare(`
        UPDATE ik_circuit_breakers
        SET state = 'HALF_OPEN', probing = 1, success_count_in_half_open = 0, updated_at = ?
        WHERE name = ?
      `).run(now, name);
      return { allowed: true, breaker: { ...breaker, state: "HALF_OPEN" } };
    }
    // Still within the open window — fail fast, don't even call the function.
    return { allowed: false, breaker };
  }

  if (breaker.state === "HALF_OPEN") {
    if (breaker.probing) {
      // Another probe is already in flight — reject fast rather than
      // stacking concurrent probes, which would defeat the point of
      // testing recovery with a single controlled call.
      return { allowed: false, breaker };
    }
    db.prepare(`UPDATE ik_circuit_breakers SET probing = 1, updated_at = ? WHERE name = ?`).run(now, name);
    return { allowed: true, breaker };
  }

  return { allowed: false, breaker };
}

function recordSuccess(db, name, options) {
  const breaker = db.prepare("SELECT * FROM ik_circuit_breakers WHERE name = ?").get(name);
  const now = Date.now();

  if (breaker.state === "HALF_OPEN") {
    const newSuccessCount = breaker.success_count_in_half_open + 1;
    if (newSuccessCount >= options.successCountToClose) {
      db.prepare(`
        UPDATE ik_circuit_breakers
        SET state = 'CLOSED', request_count = 0, failure_count = 0,
            success_count_in_half_open = 0, probing = 0, opened_at = NULL, updated_at = ?
        WHERE name = ?
      `).run(now, name);
      return "CLOSED";
    }
    db.prepare(`
      UPDATE ik_circuit_breakers
      SET success_count_in_half_open = ?, probing = 0, updated_at = ?
      WHERE name = ?
    `).run(newSuccessCount, now, name);
    return "HALF_OPEN";
  }

  // CLOSED state — just track it as part of the rolling request count.
  db.prepare(`
    UPDATE ik_circuit_breakers
    SET request_count = request_count + 1, updated_at = ?
    WHERE name = ?
  `).run(now, name);
  return "CLOSED";
}

function recordFailure(db, name, options) {
  const breaker = db.prepare("SELECT * FROM ik_circuit_breakers WHERE name = ?").get(name);
  const now = Date.now();

  if (breaker.state === "HALF_OPEN") {
    // Probe failed — straight back to OPEN, no partial credit.
    db.prepare(`
      UPDATE ik_circuit_breakers
      SET state = 'OPEN', opened_at = ?, probing = 0, success_count_in_half_open = 0, updated_at = ?
      WHERE name = ?
    `).run(now, now, name);
    return "OPEN";
  }

  const newRequestCount = breaker.request_count + 1;
  const newFailureCount = breaker.failure_count + 1;
  const failureRate = newFailureCount / newRequestCount;

  if (newRequestCount >= options.minimumRequests && failureRate >= options.failureRateThreshold) {
    db.prepare(`
      UPDATE ik_circuit_breakers
      SET state = 'OPEN', request_count = ?, failure_count = ?, opened_at = ?, updated_at = ?
      WHERE name = ?
    `).run(newRequestCount, newFailureCount, now, now, name);
    return "OPEN";
  }

  db.prepare(`
    UPDATE ik_circuit_breakers
    SET request_count = ?, failure_count = ?, updated_at = ?
    WHERE name = ?
  `).run(newRequestCount, newFailureCount, now, name);
  return "CLOSED";
}

module.exports = { getOrCreateBreaker, checkBeforeCall, recordSuccess, recordFailure };