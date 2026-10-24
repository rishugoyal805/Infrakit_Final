const core = require('./index');

core.bus.on('package:registered', (info) => {
  console.log('[registry event]', info);
});

core.register('rate-limiter', { version: '0.1.0' });
core.register('load-balancer', { version: '1.1.4' });

console.log('config:', core.config());
console.log('registered packages:', core.listPackages());