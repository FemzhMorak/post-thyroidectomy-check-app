import { useEffect, useRef, useState } from 'react';
import { getRiskZone } from '../utils/diagnose.js';

const STATUS_LINES = [
  'Checking TSH levels...',
  'Analysing Free T3...',
  'Analysing Free T4...',
  'Calculating risk score...',
  'Generating recommendations...',
];

const CX = 100;
const CY = 100;
const R = 80;
const ARC_DEGREES = 240;
const ARC_LENGTH = (ARC_DEGREES / 360) * 2 * Math.PI * R;

function point(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

const START = point(150);
const END = point(30);
const ARC_PATH = `M ${START.x.toFixed(2)} ${START.y.toFixed(2)} A ${R} ${R} 0 1 1 ${END.x.toFixed(2)} ${END.y.toFixed(2)}`;

const FILL_DURATION = 2500;
const TOTAL_DURATION = 3500;

function spawnParticles(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const count = 30;
  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.8;
    return {
      x: w / 2,
      y: h / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 2,
      born: performance.now(),
    };
  });

  let raf;
  function tick(now) {
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    for (const p of particles) {
      const age = now - p.born;
      if (age > 1500) continue;
      alive = true;
      const t = age / 1500;
      p.x += p.vx;
      p.y += p.vy;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (alive) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export default function AnalysisLoader({ targetScore, onComplete }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const lineTimer = setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 600);

    let raf;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / FILL_DURATION);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplayScore(Math.round(eased * targetScore));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    const timers = [];
    timers.push(
      setTimeout(() => {
        if (targetScore > 60) {
          setPulse(true);
          setTimeout(() => setPulse(false), 800);
        }
        if (targetScore < 20 && canvasRef.current) {
          spawnParticles(canvasRef.current);
          setTimeout(() => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }, 1500);
        }
      }, FILL_DURATION)
    );

    timers.push(setTimeout(() => setFadingOut(true), TOTAL_DURATION - 200));
    timers.push(setTimeout(() => onComplete(), TOTAL_DURATION));

    return () => {
      clearInterval(lineTimer);
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dashOffset = ARC_LENGTH * (1 - displayScore / 100);
  const color = getRiskZone(displayScore).color;

  return (
    <div className={`loader-overlay${fadingOut ? ' fading-out' : ''}`}>
      <div className="loader-panel">
        <div className="loader-gauge-wrap">
          <svg className="loader-gauge-svg" viewBox="0 0 200 200">
            <path d={ARC_PATH} stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path
              d={ARC_PATH}
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke 200ms linear' }}
            />
          </svg>
          <canvas ref={canvasRef} className="loader-particle-canvas" />
          <div className="loader-gauge-readout">
            <div className={`loader-gauge-score${pulse ? ' pulse' : ''}`} style={{ color }}>{displayScore}</div>
          </div>
        </div>
        <div className="loader-status-text" key={lineIndex}>{STATUS_LINES[lineIndex]}</div>
      </div>
    </div>
  );
}
