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

// Rough retest interval per diagnosis state, matching the timeline text
// elsewhere in the app (6-8 weeks for hypo/hyper, 3-6 months borderline,
// 6-12 months once optimal) — used for the desktop summary strip's
// "next retest due" date.
const RETEST_DAYS = {
  hypothyroid: 56,
  hyperthyroid: 56,
  borderline_hypo: 90,
  borderline_hyper: 90,
  optimal: 180,
};

function computeRetestDate(dateStr, dx) {
  const days = RETEST_DAYS[dx] || 90;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function saveLastResult({ tsh, target, date, dx, dose }) {
  try {
    const retestDate = dx ? computeRetestDate(date, dx) : null;
    localStorage.setItem(KEY, JSON.stringify({ tsh, target, date, dx, dose, retestDate }));
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
