// Local-only weekly wellness check-in log.
const KEY = 'thyrotrack_wellness_logs';

export function getWellnessLogs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logWellness(feeling) {
  const logs = getWellnessLogs();
  const now = new Date();
  const entry = { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5), feeling };
  logs.push(entry);
  try {
    localStorage.setItem(KEY, JSON.stringify(logs));
  } catch {
    // Storage unavailable — logging silently no-ops for this session.
  }
  return entry;
}
