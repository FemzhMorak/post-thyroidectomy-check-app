import { useRef, useState } from 'react';

const CLOSED = 'closed';
const SCALE = 'scale';
const FLIP1 = 'flip1';
const FLIP2 = 'flip2';
const OPEN = 'open';
const CLOSING1 = 'closing1';
const CLOSING2 = 'closing2';

const FULLSCREEN_PHASES = new Set([FLIP2, OPEN, CLOSING1]);
const OPEN_TRANSITION_PHASES = new Set([SCALE, FLIP1, FLIP2, OPEN, CLOSING1, CLOSING2]);

export default function FlipCard({
  slot,
  entering,
  borderColor,
  glowColor,
  icon,
  title,
  summary,
  pulseWorse,
  improvingTag,
  renderBack,
  onOpenChange,
}) {
  const [phase, setPhase] = useState(CLOSED);
  const [backVisible, setBackVisible] = useState(false);
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function open() {
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

  const isFullscreen = FULLSCREEN_PHASES.has(phase);
  const isOpenTransition = OPEN_TRANSITION_PHASES.has(phase);

  const classNames = [
    'result-card',
    `slot-${slot}`,
    entering && phase === CLOSED ? 'entering' : '',
    pulseWorse ? 'pulse-worse' : '',
    isOpenTransition ? 'is-open' : '',
    isFullscreen ? 'fullscreen' : '',
    `phase-${phase}`,
  ]
    .filter(Boolean)
    .join(' ');

  const style =
    phase === CLOSED
      ? {
          border: `1px solid ${borderColor}`,
          boxShadow: `${glowColor.shadow}, 0 0 16px ${glowColor.glow}`,
        }
      : undefined;

  return (
    <div className={classNames} style={style} onClick={phase === CLOSED ? open : undefined}>
      {improvingTag && phase === CLOSED && <div className="improving-tag">{'↓ Improving'}</div>}
      <div className="card-flip-inner">
        <div className="card-face card-face-front">
          <div className="card-top-row">
            <span className="card-icon">{icon}</span>
            <span className="card-title">{title}</span>
          </div>
          <div className="card-summary">{summary}</div>
          <div className="card-tap-hint">{'Tap to open →'}</div>
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
  );
}
