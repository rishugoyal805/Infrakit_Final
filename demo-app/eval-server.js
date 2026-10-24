require("dotenv").config();
const express = require("express");

const core = require("@infrakit/core");
const { applyRateLimits } = require("@infrakit/rate-limiter");
const shield = require("@infrakit/shield");
const breaker = require("@infrakit/breaker");
const queue = require("@infrakit/queue");

core.bus.on("rate_limit_exceeded", (i) => console.log(`  [event] rate_limit_exceeded  ip=${i.ip} route=${i.route}`));
core.bus.on("ip_blocked", (i) => console.log(`  [event] ip_blocked  ip=${i.ip} reason=${i.reason}`));
core.bus.on("breaker:opened", (i) => console.log(`  [event] breaker:opened  name=${i.name}`));
core.bus.on("breaker:half_open", (i) => console.log(`  [event] breaker:half_open  name=${i.name}`));
core.bus.on("breaker:closed", (i) => console.log(`  [event] breaker:closed  name=${i.name}`));
core.bus.on("queue:job_completed", (i) => console.log(`  [event] queue:job_completed  id=${i.id} attempts=${i.attempts}`));
core.bus.on("queue:job_failed", (i) => console.log(`  [event] queue:job_failed  id=${i.id}`));

const app = express();
app.use(express.json());

shield.init(app);
applyRateLimits(app, {});
queue.init({ pollIntervalMs: 500, batchSize: 5 });
breaker.init({ failureRateThreshold: 0.5, minimumRequests: 3, openTimeoutMs: 3000, successCountToClose: 1 });

app.get("/api/ping", (req, res) => res.json({ message: "pong from /api" }));
app.get("/other/ping", (req, res) => res.json({ message: "pong from /other" }));

// --- breaker demo route: fails while `shouldFail` is true ---
let shouldFail = true;
app.get("/breaker-demo/reset-fail", (req, res) => { shouldFail = true; res.json({ shouldFail }); });
app.get("/breaker-demo/reset-ok", (req, res) => { shouldFail = false; res.json({ shouldFail }); });
app.get("/breaker-demo/call", async (req, res) => {
  try {
    const result = await breaker.execute("demo-backend", async () => {
      if (shouldFail) throw new Error("backend down");
      return "backend response";
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(err.name === "BreakerOpenError" ? 503 : 500).json({ success: false, error: err.message });
  }
});

// --- queue demo route ---
let queueAttempts = 0;
queue.process("eval-demo-job", async (payload) => {
  console.log(`  [queue] handler running, attempt for job:`, payload);
  if (payload.failTwice && queueAttempts < 2) {
    queueAttempts++;
    throw new Error("simulated failure");
  }
  return { done: true };
});
app.post("/queue-demo/submit", (req, res) => {
  queueAttempts = 0;
  const id = queue.add("eval-demo-job", { failTwice: true });
  res.json({ jobId: id });
});
app.get("/queue-demo/status/:id", (req, res) => {
  res.json(queue.getJob(parseInt(req.params.id)));
});

// --- hidden admin route: in-process unblock, terminal-driven, no dashboard needed ---
app.post("/_eval-admin/unblock", (req, res) => {
  shield.unblockIp(req.body.ip || "::1");
  console.log(`  [admin] unblocked ${req.body.ip || "::1"}`);
  res.json({ ok: true });
});

app.listen(4000, () => {
  console.log("eval-server running on :4000  (core, rate-limiter, shield, breaker, queue)");
});