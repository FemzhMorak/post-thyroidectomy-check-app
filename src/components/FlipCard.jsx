import { useRef, useState } from 'react';

const CLOSED = 'closed';
const SCALE = 'scale';
const FLIP1 = 'flip1';
const FLIP2 = 'flip2';
const OPEN = 'open';
const CLOSING1 = 'closing1';
const CLOSING2 = 'closing2';

const MODAL_PHASES = new Set([FLIP2, OPEN, CLOSING1]);
const OPEN_TRANSITION_PHASES = new Set([SCALE, FLIP1, FLIP2, OPEN, CLOSING1, CLOSING2]);

function hexToRgba(hex, alpha) {
  const clean = (hex || '').replace('#', '');
  if (clean.length !== 6) return `rgba(59, 130, 246, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const FILL_DURATION = 1200;
const STAGGER_STEP = 200;

// Content nearest the bottom of the card is "reached" by the rising fill
// soonest, so it gets the shortest delay; content near the top waits longest.
function revealDelay(i, total) {
  const frac = 1 - (i + 1) / (total + 1);
  return Math.round(frac * FILL_DURATION);
}

export default function FlipCard({
  slot,
  entering,
  borderColor,
  glowColor,
  icon,
  title,
  frontBody,
  illustration,
  fillColor,
  stagger,
  pulseWorse,
  improvingTag,
  renderBack,
  onOpenChange,
  blank,
  pulse,
}) {
  const [phase, setPhase] = useState(CLOSED);
  const [backVisible, setBackVisible] = useState(false);
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function open() {
    if (blank) return;
    if (phase !== CLOSED) return;
    onOpenChange?.(true);
    setPhase(SCALE);
    timers.current.push(setTimeout(() => setPhase(FLIP1), 100));
    timers.current.push(setTimeout(() => setPhase(FLIP2), 300));
    timers.current.push(
      setTimeout(() => {
        setPhase(OPEN);
        setBackVisible(true);
      }, 500)
    );
  }

  function close() {
    clearTimers();
    setBackVisible(false);
    timers.current.push(
      setTimeout(() => {
        setPhase(CLOSING1);
        timers.current.push(
          setTimeout(() => {
            setPhase(CLOSING2);
            timers.current.push(
              setTimeout(() => {
                setPhase(CLOSED);
                onOpenChange?.(false);
              }, 150)
            );
          }, 150)
        );
      }, 200)
    );
  }

  const isModal = MODAL_PHASES.has(phase);
  const isOpenTransition = OPEN_TRANSITION_PHASES.has(phase);

  const classNames = [
    'result-card',
    `slot-${slot}`,
    entering && phase === CLOSED ? 'entering' : '',
    pulseWorse ? 'pulse-worse' : '',
    pulse ? 'pulse-refresh' : '',
    blank ? 'blank' : '',
    isOpenTransition ? 'is-open' : '',
    isModal ? 'card-modal' : '',
    `phase-${phase}`,
  ]
    .filter(Boolean)
    .join(' ');

  const fillDelay = (stagger || 0) * STAGGER_STEP;
  const fillVars = fillColor ? { '--fill-color': fillColor, '--fill-delay': `${fillDelay}ms` } : {};

  let style;
  if (phase === CLOSED) {
    style = {
      ...fillVars,
      border: `1px solid ${borderColor}`,
      boxShadow: `${glowColor.shadow}, 0 0 16px ${glowColor.glow}`,
    };
  } else if (isModal) {
    style = {
      ...fillVars,
      border: `1px solid ${borderColor}`,
      boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 40px ${hexToRgba(borderColor, 0.15)}`,
    };
  }

  return (
    <>
      {isModal && <div className="card-modal-backdrop" onClick={close} aria-hidden="true" />}
      <div className={classNames} style={style} onClick={phase === CLOSED && !blank ? open : undefined}>
        {improvingTag && phase === CLOSED && <div className="improving-tag">{'↓ Improving'}</div>}
        <div className="card-flip-inner">
          <div className="card-face card-face-front">
            {!blank && (
              <div className="card-fill-wrap" aria-hidden="true">
                <div className="card-fill" />
              </div>
            )}
            {illustration && <div className="card-illustration">{illustration}</div>}
            <div className="card-front-content">
              <div className="card-top-row">
                <span className="card-icon">{icon}</span>
                <span className="card-title">{title}</span>
              </div>
              {blank ? (
                <div className="card-summary-blank">Results will appear here after analysis</div>
              ) : (
                <div className="card-front-body">
                  {frontBody.map((node, i) => (
                    <div
                      key={i}
                      className="card-reveal-line"
                      style={{ animationDelay: `${fillDelay + revealDelay(i, frontBody.length)}ms` }}
                    >
                      {node}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="card-face card-face-back">
            <div className={`card-back-content${backVisible ? ' visible' : ''}`}>
              <div className="card-back-header">
                <div className="card-back-header-left">
                  <span className="card-icon">{icon}</span>
                  <span>{title}</span>
                </div>
                <button className="card-close-btn" onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Close">
                  &times;
                </button>
              </div>
              <div className="card-back-scroll">{backVisible && renderBack(close)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
