const readline = require("readline");

const BASE = "http://localhost:4000";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(msg) {
  return new Promise((resolve) => {
    rl.question(msg, (answer) => {
      if (answer.trim().toLowerCase() === "unblock") {
        fetch(`${BASE}/_eval-admin/unblock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip: "::1" }) })
          .then(() => console.log("-> unblocked ::1\n"))
          .then(() => resolve(ask(msg))); // ask again after unblocking, don't advance the step
      } else {
        resolve();
      }
    });
  });
}

async function pause(label) {
  await ask(`\n[Press Enter to continue — or type "unblock" if locked out]  ${label}`);
}

async function get(path) {
  const res = await fetch(BASE + path);
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function post(path, body) {
  const res = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  return { status: res.status, body: await res.json().catch(() => null) };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const steps = {
  async ratelimit() {
    console.log("\n== RATE LIMITER ==");
    console.log("Firing 4 requests at /api/ping (capacity 3)...");
    for (let i = 1; i <= 4; i++) {
      const r = await get("/api/ping");
      console.log(`  request ${i}: ${r.status} ${JSON.stringify(r.body)}`);
    }
  },

  async shield() {
    console.log("\n== SHIELD (cross-package auto-block) ==");
    console.log("Tripping /other/ping too — same IP, second distinct route...");
    for (let i = 1; i <= 4; i++) {
      const r = await get("/other/ping");
      console.log(`  request ${i}: ${r.status} ${JSON.stringify(r.body)}`);
    }
    await sleep(200);
    console.log("Now calling /api/ping again — should be blocked without rate-limiter even running:");
    const r = await get("/api/ping");
    console.log(`  result: ${r.status} ${JSON.stringify(r.body)}`);
  },

  async breaker() {
    console.log("\n== CIRCUIT BREAKER ==");
    await post("/breaker-demo/reset-fail");
    console.log("Backend set to fail. Calling 3 times to trip the breaker...");
    for (let i = 1; i <= 3; i++) {
      const r = await post("/breaker-demo/call");
      console.log(`  call ${i}: ${r.status} ${JSON.stringify(r.body)}`);
    }
    console.log("Breaker should now be OPEN. Calling once more — should fail FAST:");
    const r4 = await post("/breaker-demo/call");
    console.log(`  call 4: ${r4.status} ${JSON.stringify(r4.body)}`);

    console.log("Waiting 3.5s for openTimeoutMs, then fixing the backend for the probe...");
    await sleep(3500);
    await post("/breaker-demo/reset-ok");
    const r5 = await post("/breaker-demo/call");
    console.log(`  probe call: ${r5.status} ${JSON.stringify(r5.body)} <- should succeed and CLOSE the breaker`);
  },

  async queue() {
    console.log("\n== QUEUE (retry + backoff) ==");
    const submit = await post("/queue-demo/submit");
    console.log(`  submitted job id ${submit.body.jobId}`);
    console.log("  waiting for retries to play out (job fails twice, then succeeds)...");
    await sleep(8000);
    const status = await get(`/queue-demo/status/${submit.body.jobId}`);
    console.log(`  final job state:`, status.body);
  }
};

async function runAll() {
  await pause("Demo: rate-limiter -> shield -> breaker -> queue");
  await steps.ratelimit();
  await pause("Next: shield cross-package auto-block");
  await steps.shield();
  await pause("Next: circuit breaker full trip/recover cycle");
  await steps.breaker();
  await pause("Next: queue retry with exponential backoff");
  await steps.queue();
  console.log("\nDemo complete.");
  rl.close();
}

const arg = process.argv[2];
if (arg && steps[arg]) {
  steps[arg]().then(() => rl.close());
} else if (arg) {
  console.log(`Unknown step "${arg}". Available: ${Object.keys(steps).join(", ")}`);
  rl.close();
} else {
  runAll();
}