import { useEffect, useState } from 'react';

const CX = 40;
const CY = 38;
const R = 30;

function point(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) };
}

const START = point(180);
const END = point(0);
const ARC_PATH = `M ${START.x.toFixed(2)} ${START.y.toFixed(2)} A ${R} ${R} 0 0 1 ${END.x.toFixed(2)} ${END.y.toFixed(2)}`;
const ARC_LENGTH = Math.PI * R;
const DURATION = 3000;

// Zone thresholds/colors/one-line descriptions for the mini gauge readout.
const ZONES = [
  { max: 20, label: 'Stable', color: '#10B981', desc: 'Well controlled — maintain routine' },
  { max: 40, label: 'Monitor', color: '#84CC16', desc: 'Slightly off — watch symptoms' },
  { max: 60, label: 'Attention Needed', color: '#F59E0B', desc: 'Out of range — book appointment' },
  { max: 80, label: 'Urgent', color: '#F97316', desc: 'See your doctor this week' },
  { max: 100, label: 'Critical', color: '#EF4444', desc: 'Seek medical care immediately' },
];

function zoneFor(score) {
  return ZONES.find((z) => score <= z.max) || ZONES[ZONES.length - 1];
}

// Compact 80px arc gauge for the form header — empty grey before analysis,
// fills with a color sweep while analyzing, and shows the final score after.
export default function MiniRiskGauge({ state, score, fromScore, triggerId }) {
  const [display, setDisplay] = useState(state === 'done' ? score : 0);

  useEffect(() => {
    if (state !== 'analyzing') {
      setDisplay(state === 'done' ? score : 0);
      return;
    }
    let raf;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplay(Math.round(fromScore + (score - fromScore) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerId, state]);

  const zone = state === 'idle' ? null : zoneFor(display);
  const color = zone ? zone.color : '#334155';
  const pct = state === 'idle' ? 0 : display / 100;
  const dashOffset = ARC_LENGTH * (1 - pct);

  return (
    <div className="mini-risk-gauge">
      <svg viewBox="0 0 80 44" className="mini-risk-gauge-svg">
        <path d={ARC_PATH} stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" fill="none" />
        {state !== 'idle' && (
          <path
            d={ARC_PATH}
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke 200ms linear' }}
          />
        )}
      </svg>
      <div className="mini-risk-gauge-readout">
        <div className="mini-risk-gauge-score" style={{ color }}>{state === 'idle' ? '--' : display}</div>
        {zone && <div className="mini-risk-gauge-zone" style={{ color }}>{zone.label}</div>}
        <div className="mini-risk-gauge-desc">{zone ? zone.desc : 'Awaiting results'}</div>
      </div>
    </div>
  );
}
