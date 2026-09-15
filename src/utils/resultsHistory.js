// Local array of past analyses (localStorage), mirrored to the backend for
// the doctor report PDF. Distinct from history.js's single "last result"
// (which only powers the same/worse/improved comparison banner) — this one
// keeps everything, for the TSH trend prediction and dose-response table.
const KEY = 'thyrotrack_results_history';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatPeriod(fromStr, toStr) {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (fromStr === toStr) return `${MONTHS[from.getMonth()]} ${from.getFullYear()}`;
  return `${MONTHS[from.getMonth()]} ${from.getFullYear()} – ${MONTHS[to.getMonth()]} ${to.getFullYear()}`;
}

// Rough retest interval per diagnosis state (6-8 weeks hypo/hyper, 3-6
// months borderline, 6-12 months once optimal), matching the timeline text
// elsewhere in the app.
const RETEST_DAYS = {
  hypothyroid: 56,
  hyperthyroid: 56,
  borderline_hypo: 90,
  borderline_hyper: 90,
  optimal: 180,
};

export function computeRetestDate(dateStr, dx) {
  const days = RETEST_DAYS[dx] || 90;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return null;
  return formatDate(new Date(dateStr));
}

export function getResultsHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addResultToHistory(entry) {
  const history = getResultsHistory();
  history.push(entry);
  history.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    // Storage unavailable — history simply won't persist this session.
  }
  fetch('/api/lab-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {});
  return history;
}

// Trend prediction from the last 3 results (needs >= 2 *previous* results,
// i.e. >= 3 total including the one just analyzed).
export function computeTrend(history) {
  if (!history || history.length < 3) return null;
  const last3 = history.slice(-3);
  const oldest = last3[0];
  const newest = last3[last3.length - 1];
  if (oldest.tsh == null || newest.tsh == null) return null;

  const weeksBetween = Math.max(
    1,
    Math.round((new Date(newest.date) - new Date(oldest.date)) / (7 * 24 * 60 * 60 * 1000))
  );
  const change = newest.tsh - oldest.tsh;
  const pctChange = oldest.tsh !== 0 ? Math.abs(change) / oldest.tsh : 0;
  const weekWord = (n) => (n === 1 ? 'week' : 'weeks');

  if (pctChange < 0.1) {
    return {
      kind: 'stable',
      color: 'green',
      message: `Your TSH has been stable over your last ${last3.length} readings. Continue current management.`,
    };
  }

  if (change < 0) {
    const rate = (oldest.tsh - newest.tsh) / weeksBetween;
    const target = 2.0;
    if (rate > 0 && newest.tsh > target) {
      const projectedWeeks = Math.max(1, Math.round((newest.tsh - target) / rate));
      const projectedDate = new Date(newest.date);
      projectedDate.setDate(projectedDate.getDate() + projectedWeeks * 7);
      return {
        kind: 'improving',
        color: 'green',
        message: `At your current rate of improvement, your TSH is projected to reach the optimal range (0.5–2.0) in approximately ${projectedWeeks} ${weekWord(projectedWeeks)} — around ${formatDate(projectedDate)}.`,
      };
    }
    return {
      kind: 'improving',
      color: 'green',
      message: `Your TSH has fallen from ${oldest.tsh} to ${newest.tsh} over ${weeksBetween} ${weekWord(weeksBetween)}, trending toward your target range.`,
    };
  }

  const rate = (newest.tsh - oldest.tsh) / weeksBetween;
  let dateNote = '';
  const upper = 4.94;
  if (rate > 0 && newest.tsh < upper) {
    const weeksToUpper = Math.max(1, Math.round((upper - newest.tsh) / rate));
    const projectedDate = new Date(newest.date);
    projectedDate.setDate(projectedDate.getDate() + weeksToUpper * 7);
    dateNote = ` by around ${formatDate(projectedDate)}`;
  }
  return {
    kind: 'worsening',
    color: newest.tsh > 10 ? 'red' : 'amber',
    message: `Your TSH has risen from ${oldest.tsh} to ${newest.tsh} over ${weeksBetween} ${weekWord(weeksBetween)}. If this trend continues, your levels may require attention${dateNote}.`,
  };
}

// Groups results by dose, showing average TSH and outcome per dose tried.
export function getDoseCorrelation(history) {
  const byDose = {};
  (history || []).forEach((r) => {
    if (r.dose == null || r.tsh == null) return;
    const key = String(r.dose);
    if (!byDose[key]) byDose[key] = { dose: r.dose, tshValues: [], dates: [] };
    byDose[key].tshValues.push(r.tsh);
    byDose[key].dates.push(r.date);
  });

  const rows = Object.values(byDose).map((g) => {
    const avg = g.tshValues.reduce((a, b) => a + b, 0) / g.tshValues.length;
    const sorted = [...g.dates].sort();
    let status = 'Borderline';
    if (avg < 0.5) status = 'Too high dose';
    else if (avg > 4.94) status = 'Too low';
    else if (avg >= 0.5 && avg <= 2.0) status = 'Optimal';
    return {
      dose: g.dose,
      avgTsh: Math.round(avg * 100) / 100,
      period: formatPeriod(sorted[0], sorted[sorted.length - 1]),
      status,
      count: g.tshValues.length,
    };
  });

  rows.sort((a, b) => a.dose - b.dose);

  let bestDose = null;
  const optimalRows = rows.filter((r) => r.status === 'Optimal');
  if (rows.length >= 2 && optimalRows.length > 0) {
    bestDose = optimalRows.reduce((best, r) =>
      Math.abs(r.avgTsh - 1.25) < Math.abs(best.avgTsh - 1.25) ? r : best
    ).dose;
  }

  return { rows, bestDose };
}
