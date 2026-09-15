const ARROW = { high: { glyph: '↑', cls: 'up' }, low: { glyph: '↓', cls: 'down' }, normal: { glyph: '✓', cls: 'ok' } };

export default function ComparisonTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Marker</th>
            <th>Your Result</th>
            <th>Lab Reference</th>
            <th>Optimal Target</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const arrow = ARROW[r.status];
            return (
              <tr key={r.key}>
                <td className="ct-marker">{r.label}</td>
                <td className={`ct-your-result ct-${r.status}`}>
                  <span className="ct-value">
                    {r.value}
                    {arrow && <span className={`ct-arrow ${arrow.cls}`}>{arrow.glyph}</span>}
                  </span>
                  <span className="ct-unit">{r.unit}</span>
                </td>
                <td className="ct-lab-ref">
                  <span className="ct-range">{r.labRef.low}{'–'}{r.labRef.high}</span>
                  <span className="ct-unit">{r.labRef.unit}</span>
                </td>
                <td className="ct-optimal">
                  <span className="ct-range">{r.optimalRef.low}{'–'}{r.optimalRef.high}</span>
                  <span className="ct-unit">{r.optimalRef.note ? `(${r.optimalRef.note})` : r.optimalRef.unit}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="comparison-source-note">
        Reference ranges sourced from ATA, BTA, NHS, ARUP, Quest Diagnostics, and LabCorp guidelines.
      </div>
    </div>
  );
}
