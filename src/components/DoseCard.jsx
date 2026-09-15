export default function DoseCard({ guidance }) {
  const { current, suggested, direction, note } = guidance;
  const suggestedClass = direction === 'decrease' ? 'dose-suggested-amber' : 'dose-suggested';

  return (
    <div className="dosage-card">
      <div className="section-label">Dose Management</div>
      <div className="dosage-header">
        <div className="dosage-title">{suggested ? 'Levothyroxine dose guidance' : 'Dosage status'}</div>
        {current != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="dose-badge dose-current">Current: {current} mcg</span>
            {suggested != null && (
              <>
                <span className="dose-arrow">&#8594;</span>
                <span className={`dose-badge ${suggestedClass}`}>Consider: {suggested} mcg</span>
              </>
            )}
          </div>
        )}
      </div>
      <div className="dosage-note" dangerouslySetInnerHTML={{ __html: note }} />
    </div>
  );
}
