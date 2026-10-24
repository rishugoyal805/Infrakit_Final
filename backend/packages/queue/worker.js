function calculateBackoff(attempts, baseMs = 1000) {
  // exponential: 1s, 2s, 4s, 8s...
  return baseMs * Math.pow(2, attempts);
}

function createWorker(getDb, handlers, options = {}) {
  const pollIntervalMs = options.pollIntervalMs || 1000;
  const batchSize = options.batchSize || 5;
  let onJobCompleted = options.onJobCompleted || (() => {});
  let onJobFailed = options.onJobFailed || (() => {});

  async function runDueJobs() {
    const db = getDb();
    const now = Date.now();

    // No "processing" state — a job stays "pending" the entire time it
    // runs. If the process crashes mid-job, it's still pending on restart
    // and will run again. This is the documented duplicate-execution risk,
    // not solved until @infrakit/idempotent.
    const dueJobs = db
      .prepare(
        `
        SELECT * FROM ik_queue_jobs
        WHERE status = 'pending' AND run_at <= ?
        ORDER BY priority DESC, run_at ASC
        LIMIT ?
      `,
      )
      .all(now, batchSize);

    for (const job of dueJobs) {
      const handler = handlers.get(job.queue_name);
      if (!handler) continue; // no handler registered for this queue yet — leave pending

      const start = Date.now();
      const attemptNumber = job.attempts + 1;

      try {
        const payload = JSON.parse(job.payload);
        const handlerResult = await handler(payload);

        const duration = Date.now() - start;
        db.prepare(
          `
    UPDATE ik_queue_jobs
    SET status = 'done', attempts = ?, result = ?, updated_at = ?
    WHERE id = ?
  `,
        ).run(
          attemptNumber,
          JSON.stringify(handlerResult ?? null),
          Date.now(),
          job.id,
        );

        db.prepare(
          `
    INSERT INTO ik_queue_attempts (job_id, attempt_number, timestamp, success, duration_ms)
    VALUES (?, ?, ?, 1, ?)
  `,
        ).run(job.id, attemptNumber, Date.now(), duration);

        onJobCompleted({
          id: job.id,
          queue: job.queue_name,
          attempts: attemptNumber,
        });
      } catch (err) {
        const duration = Date.now() - start;

        db.prepare(
          `
          INSERT INTO ik_queue_attempts (job_id, attempt_number, timestamp, success, error, duration_ms)
          VALUES (?, ?, ?, 0, ?, ?)
        `,
        ).run(job.id, attemptNumber, Date.now(), err.message, duration);

        if (attemptNumber >= job.max_attempts) {
          // exhausted retries — still lands in "done", just flagged failed=1,
          // since the doc specifies only pending/done as real states
          db.prepare(
            `
            UPDATE ik_queue_jobs
            SET status = 'done', failed = 1, attempts = ?, last_error = ?, updated_at = ?
            WHERE id = ?
          `,
          ).run(attemptNumber, err.message, Date.now(), job.id);

          onJobFailed({
            id: job.id,
            queue: job.queue_name,
            attempts: attemptNumber,
            error: err.message,
          });
        } else {
          const delay = calculateBackoff(attemptNumber);
          db.prepare(
            `
            UPDATE ik_queue_jobs
            SET attempts = ?, run_at = ?, last_error = ?, updated_at = ?
            WHERE id = ?
          `,
          ).run(
            attemptNumber,
            Date.now() + delay,
            err.message,
            Date.now(),
            job.id,
          );
        }
      }
    }
  }

  const interval = setInterval(() => {
    runDueJobs().catch((e) =>
      console.error("[infrakit/queue] worker tick error:", e.message),
    );
  }, pollIntervalMs);
  if (typeof interval.unref === "function") interval.unref();

  return { runDueJobs };
}

module.exports = { createWorker, calculateBackoff };
