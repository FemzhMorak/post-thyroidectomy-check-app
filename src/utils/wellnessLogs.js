// Local-only weekly wellness check-in log, mirrored to the backend
// (best-effort) for the doctor report PDF's symptom trend page.
import { apiUrl } from './apiBase.js';

const KEY = 'thyrotrack_wellness_logs';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getWellnessLogs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWellnessLogs(logs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(logs));
  } catch {
    // Storage unavailable — logging silently no-ops for this session.
  }
}

export function getTodayCheckin() {
  const today = todayStr();
  const logs = getWellnessLogs();
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].date === today) return logs[i];
  }
  return null;
}

export function logWellness(feeling) {
  const logs = getWellnessLogs();
  const now = new Date();
  const entry = { date: todayStr(), time: now.toTimeString().slice(0, 5), feeling };
  logs.push(entry);
  saveWellnessLogs(logs);
  fetch(apiUrl('/api/wellness-logs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {});
  return entry;
}
