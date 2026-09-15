import { useEffect, useState } from 'react';

const CHAR_MS = 18;

export default function InterpretationBack({ text, symptoms, actions, ageNote, statusNote, dotColor }) {
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showAgeNote, setShowAgeNote] = useState(false);
  const [showStatusNote, setShowStatusNote] = useState(false);

  useEffect(() => {
    let i = 0;
    const timers = [];
    const interval = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        timers.push(setTimeout(() => setShowGrid(true), 200));
        timers.push(setTimeout(() => setShowAgeNote(true), 400));
        timers.push(setTimeout(() => setShowStatusNote(true), 600));
      }
    }, CHAR_MS);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="section-label">Clinical Interpretation</div>
      <p className="typewriter-text">
        {typed}
        {!done && <span className="typewriter-cursor">&nbsp;</span>}
      </p>

      {showGrid && (
        <div className="two-col fade-in-block" style={{ marginTop: '1.2rem' }}>
          <div className="info-card">
            <div className="info-card-title">
              <div className="dot" style={{ background: dotColor }} />
              Symptoms you may be experiencing
            </div>
            <ul className="symptom-list">
              {symptoms.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="info-card">
            <div className="info-card-title">
              <div className="dot" style={{ background: 'var(--blue)' }} />
              Recommended actions
            </div>
            <ul className="action-list">
              {actions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </div>
      )}

      {showAgeNote && ageNote && <div className="note-block warning fade-in-block">{ageNote}</div>}
      {showStatusNote && statusNote && <div className="note-block fade-in-block">{statusNote}</div>}
    </div>
  );
}
