import { getLastResult } from '../utils/history.js';
import { STATE_LABEL, getUrgencyColor } from '../utils/diagnose.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Desktop-only strip below the 2x2 card grid, summarising the last saved
// result. version bumps whenever a new analysis completes so this re-reads
// localStorage without needing to lift the whole result object.
export default function SummaryStrip({ version }) {
  const last = getLastResult();

  if (!last) {
    return (
      <div className="summary-strip summary-strip-empty">
        No results yet — analyze your labs above to see a summary here.
      </div>
    );
  }

  const dxColor = last.dx ? getUrgencyColor(last.dx) : 'var(--muted)';
  const dxLabel = last.dx ? STATE_LABEL[last.dx] : 'Unknown';

  return (
    <div className="summary-strip" data-version={version}>
      <div className="summary-item">
        <div className="summary-item-label">Last tested</div>
        <div className="summary-item-value">{formatDate(last.date)}</div>
      </div>
      <div className="summary-item">
        <div className="summary-item-label">Diagnosis</div>
        <span className="summary-badge" style={{ color: dxColor, borderColor: dxColor }}>{dxLabel}</span>
      </div>
      <div className="summary-item">
        <div className="summary-item-label">Dose</div>
        <span className="dose-badge dose-current">{last.dose ? `${last.dose} mcg` : 'Not set'}</span>
      </div>
      <div className="summary-item">
        <div className="summary-item-label">Next retest due</div>
        <div className="summary-item-value">{formatDate(last.retestDate)}</div>
      </div>
    </div>
  );
}
