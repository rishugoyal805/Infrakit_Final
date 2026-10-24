// Standalone usage — no @infrakit/core required.
// const fn = require('@infrakit/fn');
// fn.init(app, require('./example.config'));
// fn.register('my-fn', { trigger: 'http:POST:/webhook', handler: async (payload) => {...} });

module.exports = {
  rotationThreshold: 100
};