import { useState } from 'react';
import { getTodayLog, logDoseTaken, logMissedYesterday, getStreak } from '../utils/doseLogs.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MedicationSheet({ open, onClose, dose, onLogged }) {
  const [loggedNow, setLoggedNow] = useState(null);
  const [showMissedNote, setShowMissedNote] = useState(false);

  if (!open) return null;

  const now = new Date();
  const alreadyLogged = getTodayLog();
  const displayed = loggedNow || alreadyLogged;
  const streak = getStreak();

  function handleTakeIt() {
    const entry = logDoseTaken();
    setLoggedNow(entry);
    onLogged?.();
    setTimeout(() => onClose(), 1500);
  }

  function handleMissedYesterday() {
    logMissedYesterday();
    onLogged?.();
    setShowMissedNote(true);
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="sheet-handle" onClick={onClose} />
        <div className="sheet-title">Medication Log</div>
        <div className="sheet-subtitle">{`${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} · ${now.toTimeString().slice(0, 5)}`}</div>

        <div className="drug-info-card">
          <div className="drug-info-name">{`Levothyroxine ${dose || '—'}mcg`}</div>
          <ul className="drug-info-list">
            <li>Take on empty stomach</li>
            <li>30–60 min before food</li>
            <li>Do not take with calcium, iron, or antacids</li>
          </ul>
        </div>

        {displayed ? (
          <>
            <div className="med-logged-state">{`✓ Taken at ${displayed.time}`}</div>
            {streak >= 1 && <div className="med-streak">{`\u{1F525} ${streak} day streak`}</div>}
          </>
        ) : (
          <button className="btn-take-med" onClick={handleTakeIt}>{'✓ I took it today'}</button>
        )}

        <button type="button" className="missed-dose-link" onClick={handleMissedYesterday}>I forgot yesterday</button>
        {showMissedNote && (
          <div className="missed-dose-note">Missed doses affect your TSH levels. Try to take at the same time every day.</div>
        )}
      </div>
    </>
  );
}
