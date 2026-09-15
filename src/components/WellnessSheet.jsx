import { useState } from 'react';
import { logWellness, getTodayCheckin } from '../utils/wellnessLogs.js';
import { formatDisplayDate } from '../utils/resultsHistory.js';

const OPTIONS = [
  { key: 'good', emoji: '\u{1F60A}', label: 'Feeling good today', bg: 'rgba(16,185,129,0.12)', border: '#10B981' },
  { key: 'okay', emoji: '\u{1F610}', label: 'Feeling okay', bg: 'rgba(245,158,11,0.12)', border: '#F59E0B' },
  { key: 'bad', emoji: '\u{1F614}', label: 'Not feeling great', bg: 'rgba(239,68,68,0.12)', border: '#EF4444' },
];

const FOLLOWUP = {
  good: 'Great — consistent medication and stable levels keep you feeling this way',
  okay: 'Note any specific symptoms in your next analysis for better insight',
};

export default function WellnessSheet({ open, onClose, nextRetestDate }) {
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  if (!open) return null;

  const todayCheckin = getTodayCheckin();
  const showForm = updating || !todayCheckin;

  function handlePick(key) {
    logWellness(key);
    setSelected(key);
    setTimeout(() => onClose(), 1500);
  }

  const activeKey = selected || todayCheckin?.feeling;
  const badMessage = nextRetestDate
    ? `If this persists more than 3 days, it may indicate your levels need checking. Your next retest is due ${formatDisplayDate(nextRetestDate)}.`
    : 'If this persists more than 3 days, it may indicate your levels need checking.';
  const message = activeKey === 'bad' ? badMessage : FOLLOWUP[activeKey];

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet" role="dialog" aria-label="Wellness check-in">
        <div className="sheet-handle" onClick={onClose} />
        <div className="sheet-title">How are you feeling?</div>
        <div className="sheet-subtitle">Quick check-in — tap one</div>

        {showForm ? (
          <div className="wellness-options">
            {OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                className={`wellness-btn${selected === o.key ? ' selected' : ''}`}
                style={{ background: o.bg, borderColor: o.border }}
                onClick={() => handlePick(o.key)}
              >
                <span className="wellness-emoji">{o.emoji}</span>
                <span>{o.label}</span>
                {selected === o.key && <span className="wellness-check">✓</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="wellness-previous">
            <div className="wellness-previous-row">
              {OPTIONS.filter((o) => o.key === todayCheckin.feeling).map((o) => (
                <div key={o.key} className="wellness-previous-badge" style={{ background: o.bg, borderColor: o.border }}>
                  <span className="wellness-emoji">{o.emoji}</span>
                  <span>{o.label}</span>
                </div>
              ))}
            </div>
            <div className="wellness-previous-time">{`Logged today at ${todayCheckin.time}`}</div>
            <button type="button" className="wellness-update-link" onClick={() => setUpdating(true)}>
              Update today's check-in
            </button>
          </div>
        )}

        {message && <div className="wellness-followup-message">{message}</div>}
      </div>
    </>
  );
}
