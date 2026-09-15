import { getDoseCorrelation } from '../utils/resultsHistory.js';

const STATUS_COLOR = {
  Optimal: 'var(--green)',
  'Too low': 'var(--amber)',
  'Too high dose': 'var(--amber)',
  Borderline: 'var(--dim)',
};

export default function DoseCorrelationTable({ history }) {
  const { rows, bestDose } = getDoseCorrelation(history);
  if (rows.length === 0) return null;

  return (
    <div className="dose-correlation-card">
      <div className="section-label">Your levothyroxine response history</div>
      <div className="dose-correlation-table-wrap">
        <table className="dose-correlation-table">
          <thead>
            <tr>
              <th>Dose</th>
              <th>Avg TSH</th>
              <th>Period</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dose}>
                <td>{`${r.dose}mcg`}</td>
                <td>{r.avgTsh}</td>
                <td>{r.period}</td>
                <td style={{ color: STATUS_COLOR[r.status] || 'var(--dim)' }}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bestDose != null && (
        <div className="dose-correlation-suggestion">
          {`Your data suggests ${bestDose}mcg produces the most stable TSH for you.`}
        </div>
      )}
    </div>
  );
}
