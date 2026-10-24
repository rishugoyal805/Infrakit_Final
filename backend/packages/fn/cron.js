function parseField(field) {
  if (field === "*") return null; // null = matches anything
  return new Set(field.split(",").map((n) => parseInt(n, 10)));
}

function fieldMatches(parsed, value) {
  return parsed === null || parsed.has(value);
}

function cronMatches(expr, date) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`[infrakit/fn] invalid cron expression: "${expr}" — expected 5 fields`);
  }
  const [minField, hourField, domField, monthField, dowField] = parts.map(parseField);

  return (
    fieldMatches(minField, date.getMinutes()) &&
    fieldMatches(hourField, date.getHours()) &&
    fieldMatches(domField, date.getDate()) &&
    fieldMatches(monthField, date.getMonth() + 1) &&
    fieldMatches(dowField, date.getDay())
  );
}

function createCronScheduler(getCronFns, onDue) {
  const lastFiredMinute = new Map(); // fn name -> minute-key already fired

  const interval = setInterval(() => {
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

    for (const [name, def] of getCronFns()) {
      if (lastFiredMinute.get(name) === minuteKey) continue; // dedupe within the same minute
      if (cronMatches(def.trigger.cronExpr, now)) {
        lastFiredMinute.set(name, minuteKey);
        onDue(name);
      }
    }
  }, 15000); // check every 15s; dedupe-by-minute-key prevents double-firing near the boundary

  if (typeof interval.unref === "function") interval.unref();
  return interval;
}

module.exports = { cronMatches, createCronScheduler };