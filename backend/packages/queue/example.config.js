// Standalone usage — no @infrakit/core required.
// const queue = require('@infrakit/queue');
// queue.init(require('./example.config'));
// queue.process('my-queue', async (payload) => { ... });
// queue.add('my-queue', { some: 'data' });

module.exports = {
  pollIntervalMs: 1000,
  batchSize: 5,
  rotationThreshold: 100,       // successful jobs kept
  failedRotationThreshold: 1000 // failed jobs kept longer, diagnostic value
};