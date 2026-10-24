function rotateSuccessfulJobs(db, threshold = 100) {
  const countRow = db
    .prepare("SELECT COUNT(*) as cnt FROM ik_queue_jobs WHERE status = 'done' AND failed = 0")
    .get();

  if (countRow.cnt <= threshold) return 0;

  const excess = countRow.cnt - threshold;
  const oldest = db
    .prepare(`
      SELECT id FROM ik_queue_jobs
      WHERE status = 'done' AND failed = 0
      ORDER BY updated_at ASC
      LIMIT ?
    `)
    .all(excess);

  const ids = oldest.map((r) => r.id);
  if (ids.length === 0) return 0;

  const placeholders = ids.map(() => "?").join(",");
  db.prepare(`DELETE FROM ik_queue_attempts WHERE job_id IN (${placeholders})`).run(...ids);
  db.prepare(`DELETE FROM ik_queue_jobs WHERE id IN (${placeholders})`).run(...ids);

  return ids.length;
}

function rotateFailedJobs(db, threshold = 1000) {
  // Failed jobs are diagnostic — kept much longer than successful ones,
  // same retention tier as general application logs (1000 rows), not
  // the 100-row silent-drop tier successful jobs use.
  const countRow = db
    .prepare("SELECT COUNT(*) as cnt FROM ik_queue_jobs WHERE status = 'done' AND failed = 1")
    .get();

  if (countRow.cnt <= threshold) return 0;

  const excess = countRow.cnt - threshold;
  const oldest = db
    .prepare(`
      SELECT id FROM ik_queue_jobs
      WHERE status = 'done' AND failed = 1
      ORDER BY updated_at ASC
      LIMIT ?
    `)
    .all(excess);

  const ids = oldest.map((r) => r.id);
  if (ids.length === 0) return 0;

  const placeholders = ids.map(() => "?").join(",");
  db.prepare(`DELETE FROM ik_queue_attempts WHERE job_id IN (${placeholders})`).run(...ids);
  db.prepare(`DELETE FROM ik_queue_jobs WHERE id IN (${placeholders})`).run(...ids);

  return ids.length;
}

module.exports = { rotateSuccessfulJobs, rotateFailedJobs };