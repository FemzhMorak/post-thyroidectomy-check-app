import { useState } from 'react';
import {
  getTodayLog,
  logDoseTaken,
  logMissedYesterday,
  getStreak,
  getMissedThisWeek,
  getMonthAdherence,
} from '../utils/doseLogs.js';

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
  const missedThisWeek = getMissedThisWeek();
  const adherence = getMonthAdherence();

  function handleTakeIt() {
    const entry = logDoseTaken();
    setLoggedNow(entry);
    onLogged?.();
    setTimeout(() => onClose(), 2000);
  }

  function handleMissedYesterday() {
    logMissedYesterday();
    onLogged?.();
    setShowMissedNote(true);
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet" role="dialog" aria-label="Medication Log">
        <div className="sheet-handle" onClick={onClose} />
        <div className="sheet-title">Medication Log</div>
        <div className="sheet-subtitle">{`${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} · ${now.toTimeString().slice(0, 5)}`}</div>

        <div className="drug-info-card">
          <div className="drug-info-name">{`Levothyroxine ${dose || '—'}mcg`}</div>
          <div className="drug-info-line">Take on empty stomach</div>
          <div className="drug-info-line">30–60 min before food</div>
          <div className="drug-info-line drug-info-warn">Avoid calcium, iron, antacids</div>
        </div>

        {displayed ? (
          <>
            <button className="btn-take-med logged" disabled>
              {loggedNow ? `✓ Logged at ${displayed.time}` : `✓ Taken at ${displayed.time}`}
            </button>
            {streak >= 1 && <div className="med-streak-badge">{`\u{1F525} ${streak} day${streak === 1 ? '' : 's'} streak`}</div>}
            <div className="med-next-dose">Next dose: tomorrow at 7:00 AM</div>
            <div className="med-adherence">{`This month: ${adherence.taken}/${adherence.total} doses — ${adherence.percent}%`}</div>
          </>
        ) : (
          <button className="btn-take-med" onClick={handleTakeIt}>{'✓ I took my levothyroxine today'}</button>
        )}

        <button type="button" className="missed-dose-link" onClick={handleMissedYesterday}>I forgot yesterday</button>
        {showMissedNote && (
          <div className="missed-dose-note">Missed doses can raise TSH by 15–30% over 2–3 weeks</div>
        )}

        {missedThisWeek > 0 && (
          <div className="missed-week-warning">
            <div className="missed-week-title">{`You missed ${missedThisWeek} dose${missedThisWeek === 1 ? '' : 's'} this week`}</div>
            <div className="missed-week-sub">This may affect your TSH by the time of your next test</div>
          </div>
        )}
      </div>
    </>
  );
}
