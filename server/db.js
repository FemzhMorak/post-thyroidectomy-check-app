const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'thyrotrack.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY,
    subscription TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dose_logs (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT,
    taken INTEGER NOT NULL,
    missed_reason TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wellness_logs (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT,
    feeling TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    tsh REAL,
    ft3 REAL,
    ft4 REAL,
    dose REAL,
    dx TEXT,
    status TEXT,
    retest_date TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- push subscriptions ---
function addSubscription(subscription) {
  const json = JSON.stringify(subscription);
  const existing = db.prepare('SELECT id FROM push_subscriptions WHERE subscription = ?').get(json);
  if (existing) return existing.id;
  const info = db.prepare('INSERT INTO push_subscriptions (subscription) VALUES (?)').run(json);
  return info.lastInsertRowid;
}

function getAllSubscriptions() {
  return db.prepare('SELECT id, subscription FROM push_subscriptions').all();
}

function deleteSubscription(id) {
  db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(id);
}

// --- dose logs ---
function addDoseLog({ date, time, taken, missedReason }) {
  return db
    .prepare('INSERT INTO dose_logs (date, time, taken, missed_reason) VALUES (?, ?, ?, ?)')
    .run(date, time || null, taken ? 1 : 0, missedReason || null);
}

function getDoseLogs(limit = 500) {
  return db.prepare('SELECT * FROM dose_logs ORDER BY date DESC, id DESC LIMIT ?').all(limit);
}

function isDoseLoggedOn(date) {
  const row = db.prepare('SELECT id FROM dose_logs WHERE date = ? AND taken = 1 LIMIT 1').get(date);
  return !!row;
}

function getCurrentStreak(today) {
  const taken = new Set(
    db.prepare('SELECT DISTINCT date FROM dose_logs WHERE taken = 1').all().map((r) => r.date)
  );
  const cursor = new Date(today);
  if (!taken.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (taken.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// --- wellness logs ---
function addWellnessLog({ date, time, feeling }) {
  return db.prepare('INSERT INTO wellness_logs (date, time, feeling) VALUES (?, ?, ?)').run(date, time || null, feeling);
}

function getWellnessLogs(limit = 500) {
  return db.prepare('SELECT * FROM wellness_logs ORDER BY date DESC, id DESC LIMIT ?').all(limit);
}

// --- lab results ---
function addLabResult({ date, tsh, ft3, ft4, dose, dx, status, retestDate }) {
  return db
    .prepare('INSERT INTO lab_results (date, tsh, ft3, ft4, dose, dx, status, retest_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(date, tsh ?? null, ft3 ?? null, ft4 ?? null, dose ?? null, dx || null, status || null, retestDate || null);
}

function getLabResults(limit = 500) {
  return db.prepare('SELECT * FROM lab_results ORDER BY date ASC, id ASC LIMIT ?').all(limit);
}

function getLatestLabResult() {
  return db.prepare('SELECT * FROM lab_results ORDER BY date DESC, id DESC LIMIT 1').get();
}

module.exports = {
  db,
  addSubscription,
  getAllSubscriptions,
  deleteSubscription,
  addDoseLog,
  getDoseLogs,
  isDoseLoggedOn,
  getCurrentStreak,
  addWellnessLog,
  getWellnessLogs,
  addLabResult,
  getLabResults,
  getLatestLabResult,
};
