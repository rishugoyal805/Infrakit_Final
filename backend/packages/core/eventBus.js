const EventEmitter = require('events');

class InfraKitBus extends EventEmitter {}

// Singleton — every package that requires core gets the SAME bus instance.
// This is what makes "zero developer wiring" true: no manual passing of
// a bus object between packages, just require('@infrakit/core').bus
const bus = new InfraKitBus();

module.exports = bus;