const { openDb, DB_PATH } = require('./db');
const bus = require('./eventBus');
const { loadConfig } = require('./config');
const { register, list } = require('./registry');

let dbInstance = null;
let configInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = openDb();
  }
  return dbInstance;
}

function getConfig() {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

module.exports = {
  db: getDb,
  bus,
  config: getConfig,
  register,
  listPackages: list,
  DB_PATH
};