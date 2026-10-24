const path = require('path');
const fs = require('fs');

function loadConfig() {
  const configPath = path.join(process.cwd(), 'infrakit.config.js');
  let fileConfig = {};

  if (fs.existsSync(configPath)) {
    fileConfig = require(configPath);
  }

  // Env vars prefixed INFRAKIT_ override file config.
  // INFRAKIT_SECRET -> secret, INFRAKIT_RATE_LIMIT_CAPACITY -> rate_limit_capacity
  const envConfig = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('INFRAKIT_')) {
      const configKey = key.slice('INFRAKIT_'.length).toLowerCase();
      envConfig[configKey] = value;
    }
  }

  return { ...fileConfig, ...envConfig };
}

module.exports = { loadConfig };