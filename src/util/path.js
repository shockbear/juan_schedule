// Cross-platform path helpers for the data directory.

const path = require('path');
const fs = require('fs');
const os = require('os');

function getDataDir() {
  if (process.env.JUAN_SCHEDULE_HOME) {
    return process.env.JUAN_SCHEDULE_HOME;
  }
  const home = os.homedir();
  return path.join(home, '.juan-schedule');
}

function getDataPath() {
  return path.join(getDataDir(), 'data.json');
}

function ensureDataDir() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

module.exports = { getDataDir, getDataPath, ensureDataDir };
