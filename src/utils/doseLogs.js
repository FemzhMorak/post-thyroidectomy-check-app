// Local-only levothyroxine dose log, used for the medication bottom sheet
// and the header streak indicator.
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
