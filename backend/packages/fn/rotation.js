function rotateExecutions(db, threshold = 100) {
  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM ik_fn_executions").get();
  if (countRow.cnt <= threshold) return 0;

  const excess = countRow.cnt - threshold;
  const oldest = db
    .prepare("SELECT id FROM ik_fn_executions ORDER BY timestamp ASC LIMIT ?")
    .all(excess);

  const ids = oldest.map((r) => r.id);
  if (ids.length === 0) return 0;

  const placeholders = ids.map(() => "?").join(",");
  db.prepare(`DELETE FROM ik_fn_executions WHERE id IN (${placeholders})`).run(...ids);
  return ids.length;
}

module.exports = { rotateExecutions };