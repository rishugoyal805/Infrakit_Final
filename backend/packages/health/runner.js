async function runSingleCheck(check) {
  const timeoutMs = check.timeout || 3000;
  const start = Date.now();

  try {
    const result = await Promise.race([
      check.fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), timeoutMs);
      })
    ]);

    return {
      name: check.name,
      status: "ok",
      latency_ms: result && typeof result.latency === "number" ? result.latency : Date.now() - start
    };
  } catch (err) {
    return {
      name: check.name,
      status: err.message === "timeout" ? "timeout" : "fail",
      latency_ms: Date.now() - start,
      error: err.message
    };
  }
}

async function runChecks(checks) {
  if (!Array.isArray(checks) || checks.length === 0) return [];

  const settled = await Promise.allSettled(checks.map(runSingleCheck));

  return settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    return {
      name: checks[i] && checks[i].name ? checks[i].name : `check_${i}`,
      status: "fail",
      latency_ms: 0,
      error: s.reason ? s.reason.message : "unknown error"
    };
  });
}

function aggregateStatus(results) {
  if (results.length === 0) return "ok";
  const okCount = results.filter((r) => r.status === "ok").length;
  if (okCount === results.length) return "ok";
  if (okCount === 0) return "down";
  return "degraded";
}

module.exports = { runChecks, aggregateStatus };