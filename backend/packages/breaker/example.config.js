// Standalone usage — no @infrakit/core required.
// const breaker = require('@infrakit/breaker');
// breaker.init(require('./example.config'));
// await breaker.execute('my-service', async () => { ... });

module.exports = {
  failureRateThreshold: 0.5,
  minimumRequests: 5,
  openTimeoutMs: 10000,
  successCountToClose: 2
};