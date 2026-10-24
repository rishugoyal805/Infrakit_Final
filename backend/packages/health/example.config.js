// Standalone usage — no @infrakit/core required.
// const health = require('@infrakit/health');
// health.init(require('./example.config'));
// app.use(health.middleware());

const { createHttpCheck } = require("./checks");

module.exports = {
  path: "/health",
  checks: [
    createHttpCheck("dummy-backend", "http://localhost:4001/health", { timeout: 2000 })
  ]
};