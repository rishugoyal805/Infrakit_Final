const bus = require('./eventBus');

const registered = new Map();

function register(name, meta = {}) {
  registered.set(name, { ...meta, registeredAt: Date.now() });
  bus.emit('package:registered', { name, ...meta });
}

function list() {
  return Array.from(registered.entries()).map(([name, meta]) => ({ name, ...meta }));
}

module.exports = { register, list };