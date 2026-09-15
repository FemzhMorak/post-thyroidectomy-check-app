import { classifyValue, getBarPercent, getFlagText } from '../utils/diagnose.js';

const BAR_COLORS = {
  normal: '#10B981',
  high: '#EF4444',
  low: '#F59E0B',
  borderline: '#F59E0B',
};

// Whole-number bounds (e.g. FT4's 9.0/19.0) lose their trailing zero when
// coerced to a string directly — force at least one decimal place so the
// reference range reads "9.0" rather than "9".
function formatBound(n) {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

export default function GaugeCard({ name, value, range, unit, override }) {
  const cls = override?.cls || classifyValue(value, range);
  const flagText = override?.flag || getFlagText(cls);
  const pct = getBarPercent(value, range);
  const color = BAR_COLORS[cls];

  return (
    <div className={`gauge-card ${cls}`}>
      <div className="gauge-name">{name}</div>
      <div className="gauge-value">{value.toFixed(2)}</div>
      <div className="gauge-unit">{unit}</div>
      <div className="bar-wrap">
        <div
          className="bar-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}40, ${color})` }}
        />
        <div className="bar-marker" style={{ left: `${pct}%`, background: color }} />
      </div>
      <div className="bar-range">
        <span>{formatBound(range.low)}</span>
        <span>{formatBound(range.high)}</span>
      </div>
      <div className={`gauge-flag flag-${cls}`}>{flagText}</div>
    </div>
  );
}
