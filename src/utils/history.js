// Tiny localStorage-backed memory of the single most recent result, purely to
// power the automations (same-result banner, worse/improved comparisons).
// This app has no backend and no result history page — it only remembers
// "last time" for this one comparison.
const KEY = 'thyrotrack_last_result';

export function getLastResult() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastResult({ tsh, target, date }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ tsh, target, date }));
  } catch {
    // Storage unavailable (private browsing, quota) — automations simply won't fire.
  }
}

// Distance from the midpoint of the person's own therapeutic target, used as a
// direction-agnostic "how off is this" measure so the same comparison works
// whether the person runs hypo or hyper.
function badness(tsh, target) {
  const center = (target.low + target.high) / 2;
  return Math.abs(tsh - center);
}

export function compareToLast(tsh, target) {
  const last = getLastResult();
  if (!last) return { available: false };

  if (last.tsh === tsh) {
    return { available: true, same: true, lastDate: last.date };
  }

  const currentBadness = badness(tsh, target);
  const lastBadness = badness(last.tsh, last.target || target);
  return {
    available: true,
    same: false,
    worse: currentBadness > lastBadness,
    improved: currentBadness < lastBadness,
    lastDate: last.date,
  };
}
