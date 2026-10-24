const core1 = require('./index');
const core2 = require('./index'); // simulates a second package requiring core

core1.bus.on('rate_limit_exceeded', (payload) => {
  console.log('[listener from "package B"] received:', payload);
});

core2.bus.emit('rate_limit_exceeded', { ip: '1.2.3.4', route: '/api/login', count: 5 });