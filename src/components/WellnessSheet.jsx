import { useState } from 'react';
import { logWellness } from '../utils/wellnessLogs.js';

const OPTIONS = [
  { key: 'good', emoji: '\u{1F60A}', label: 'Feeling good', bg: 'rgba(16,185,129,0.15)', border: '#10B981' },
  { key: 'okay', emoji: '\u{1F610}', label: 'Feeling okay', bg: 'rgba(245,158,11,0.15)', border: '#F59E0B' },
  { key: 'bad', emoji: '\u{1F614}', label: 'Not great today', bg: 'rgba(239,68,68,0.15)', border: '#EF4444' },
];

export default function WellnessSheet({ open, onClose }) {
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(false);

  if (!open) return null;

  function handlePick(key) {
    logWellness(key);
    setSelected(key);
    setToast(true);
    setTimeout(() => onClose(), 1000);
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="sheet-handle" onClick={onClose} />
        <div className="sheet-title">How are you feeling?</div>
        <div className="sheet-subtitle">Tap once — takes 2 seconds</div>

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

        {toast && <div className="sheet-toast">Logged ✓</div>}
      </div>
    </>
  );
}
