// Store — single source of truth on disk.
//
// File layout: <dataDir>/data.json (default ~/.juan-schedule/data.json,
// overridable via JUAN_SCHEDULE_HOME env).
//
// All writes are atomic: write to data.json.tmp, then fs.rename. This avoids
// a half-written file if the process is killed mid-write. Reads tolerate a
// missing or empty file (returns null and the caller decides whether to seed).
//
// The store also handles lightweight schema migration: future versions can
// add a `migrate(store)` step that backfills new fields. Currently a no-op.

const fs = require('fs');
const path = require('path');
const { getDataPath, getDataDir, ensureDataDir } = require('./util/path');
const { BUILT_IN_SUBJECTS } = require('./models/subject');
const { buildSampleData } = require('./seed');

function emptyData() {
  return {
    students: [],
    courses: [],
    subjects: BUILT_IN_SUBJECTS.map(s => ({ ...s, builtIn: true })),
    currentStudentId: null,
    currentView: 'calendar',
    currentMonth: '2026-07',
    theme: 'light',
    statusFilter: 'all',
    lang: 'zh',
    version: 1,
    initialized: false,
  };
}

function migrate(data) {
  if (!data || typeof data !== 'object') return data;
  // Backfill subjects list for users upgrading from very early versions.
  if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
    data.subjects = BUILT_IN_SUBJECTS.map(s => ({ ...s, builtIn: true }));
  }
  // Ensure version field exists.
  if (typeof data.version !== 'number') data.version = 1;
  // Ensure lang field exists.
  if (typeof data.lang !== 'string') data.lang = 'zh';
  return data;
}

async function load() {
  const file = getDataPath();
  try {
    if (!fs.existsSync(file)) return null;
    const raw = await fs.promises.readFile(file, 'utf8');
    if (!raw.trim()) return null;
    const data = JSON.parse(raw);
    return migrate(data);
  } catch (e) {
    // Corrupted file — back it up and return null so caller can seed fresh.
    const backup = file + '.bak.' + Date.now();
    try {
      await fs.promises.copyFile(file, backup);
      console.error(`[store] data.json corrupted, backed up to ${backup}`);
    } catch (_) { /* ignore */ }
    return null;
  }
}

async function save(data) {
  ensureDataDir();
  const file = getDataPath();
  const tmp = file + '.tmp';
  const json = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(tmp, json, 'utf8');
  await fs.promises.rename(tmp, file);
}

// Read → mutate → write. The mutator may return a new value; if it returns
// falsy, the original `data` is used (mutated in place by reference).
async function update(mutator) {
  const current = (await load()) || emptyData();
  const result = await mutator(current);
  const next = result || current;
  await save(next);
  return next;
}

async function seedIfEmpty() {
  const existing = await load();
  if (existing && existing.initialized) return existing;
  const fresh = buildSampleData();
  await save(fresh);
  return fresh;
}

// Import a JSON blob (e.g. pushed from Web localStorage). Replaces data
// after validating it has the expected top-level shape.
async function importJSON(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON: expected an object');
  }
  if (!Array.isArray(data.students) || !Array.isArray(data.courses) || !Array.isArray(data.subjects)) {
    throw new Error('Invalid JSON: missing students/courses/subjects arrays');
  }
  const migrated = migrate({ ...emptyData(), ...data });
  migrated.initialized = true;
  await save(migrated);
  return migrated;
}

// Reset to a fresh sample. Used by `juan-schedule init` and the Web UI's
// "reset to sample data" action.
async function resetToSample() {
  const fresh = buildSampleData();
  await save(fresh);
  return fresh;
}

module.exports = {
  load,
  save,
  update,
  seedIfEmpty,
  importJSON,
  resetToSample,
  emptyData,
  getDataDir,
  getDataPath,
};
