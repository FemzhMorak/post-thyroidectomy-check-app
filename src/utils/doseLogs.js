// Local-only levothyroxine dose log (localStorage), mirrored to the backend
// (best-effort, fire-and-forget) so server-side cron jobs and the doctor
// report PDF can see it too.
import { apiUrl } from './apiBase.js';

const KEY = 'thyrotrack_dose_logs';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getDoseLogs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDoseLogs(logs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(logs));
  } catch {
    // Storage unavailable — logging silently no-ops for this session.
  }
}

function syncToServer(entry) {
  fetch(apiUrl('/api/dose-logs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {
    // Backend may not be running / reachable — local logging still works.
  });
}

export function getTodayLog() {
  return getDoseLogs().find((l) => l.date === todayStr() && l.taken) || null;
}

export function isLoggedToday() {
  return getTodayLog() !== null;
}

export function logDoseTaken() {
  const logs = getDoseLogs();
  const now = new Date();
  const entry = {
    date: todayStr(),
    time: now.toTimeString().slice(0, 5),
    taken: true,
    missedReason: null,
    timestamp: now.toISOString(),
  };
  logs.push(entry);
  saveDoseLogs(logs);
  syncToServer(entry);
  return entry;
}

export function logMissedYesterday() {
  const logs = getDoseLogs();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const entry = {
    date: y.toISOString().slice(0, 10),
    time: null,
    taken: false,
    missedReason: 'forgot',
    timestamp: new Date().toISOString(),
  };
  logs.push(entry);
  saveDoseLogs(logs);
  syncToServer(entry);
  return entry;
}

// Consecutive-day streak of taken doses, counting back from today if
// today is already logged, otherwise from yesterday.
export function getStreak() {
  const takenDates = new Set(getDoseLogs().filter((l) => l.taken).map((l) => l.date));
  const cursor = new Date();
  if (!takenDates.has(todayStr())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (takenDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Doses missed in the last 7 days (including today), for the "missed this
// week" warning in the medication sheet.
export function getMissedThisWeek() {
  const logs = getDoseLogs();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return logs.filter((l) => !l.taken && l.date >= cutoffStr).length;
}

// This-month adherence: [taken, totalDaysSoFar, percent].
export function getMonthAdherence() {
  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7);
  const logs = getDoseLogs();
  const takenDates = new Set(
    logs.filter((l) => l.taken && l.date.startsWith(monthPrefix)).map((l) => l.date)
  );
  const daysSoFar = now.getDate();
  const taken = takenDates.size;
  const percent = daysSoFar ? Math.round((taken / daysSoFar) * 100) : 0;
  return { taken, total: daysSoFar, percent };
}
