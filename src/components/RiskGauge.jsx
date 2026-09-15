import { useCallback, useRef } from 'react';
import { RISK_ZONES, getRiskZone } from '../utils/diagnose.js';

const CX = 120;
const CY = 130;
const R = 96;
const DEG_PER_POINT = 1.8; // 180 degrees spread across a 0-100 score

function polar(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) };
}

function scoreToAngle(score) {
  return 180 - score * DEG_PER_POINT;
}

// Small visual gap between zone segments so the arc reads as a segmented dial
// rather than one solid bar.
function describeZoneArc(min, max, isFirst, isLast) {
  const startScore = min + (isFirst ? 0 : 0.5);
  const endScore = max - (isLast ? 0 : 0.5);
  const p1 = polar(scoreToAngle(startScore));
  const p2 = polar(scoreToAngle(endScore));
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y}`;
}

export default function RiskGauge({ score, onChange }) {
  const svgRef = useRef(null);
  const zone = getRiskZone(score);
  const handlePos = polar(scoreToAngle(score));

  const updateFromPointer = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const dx = loc.x - CX;
      const dy = CY - loc.y;
      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (dy < 0) angleDeg = dx >= 0 ? 0 : 180;
      angleDeg = Math.max(0, Math.min(180, angleDeg));
      const newScore = Math.max(0, Math.min(100, Math.round((180 - angleDeg) / DEG_PER_POINT)));
      onChange(newScore);
    },
    [onChange]
  );

  function startDrag(e) {
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  }

  function onDrag(e) {
    if (e.buttons === 0 && e.pointerType !== 'touch') return;
    updateFromPointer(e.clientX, e.clientY);
  }

  return (
    <div className="risk-gauge-card">
      <div className="section-label">Risk Assessment</div>
      <div className="section-title" style={{ fontSize: '1rem' }}>How critical is your situation</div>
      <div className="risk-gauge-wrap">
        <svg ref={svgRef} viewBox="0 0 240 150" className="risk-gauge-svg">
          {RISK_ZONES.map((z, i) => (
            <path
              key={z.label}
              d={describeZoneArc(z.min, z.max, i === 0, i === RISK_ZONES.length - 1)}
              stroke={z.color}
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              opacity={score >= z.min && score <= z.max ? 1 : 0.45}
            />
          ))}
          <path
            d={describeZoneArc(0, 100, true, true)}
            stroke="transparent"
            strokeWidth="34"
            fill="none"
            style={{ cursor: 'pointer', touchAction: 'none' }}
            onPointerDown={startDrag}
            onPointerMove={onDrag}
          />
          <circle
            cx={handlePos.x}
            cy={handlePos.y}
            r="10"
            fill="var(--navy)"
            stroke={zone.color}
            strokeWidth="4"
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={startDrag}
            onPointerMove={onDrag}
          />
        </svg>
        <div className="risk-gauge-readout">
          <div className="risk-gauge-score" style={{ color: zone.color }}>{score}</div>
          <div className="risk-gauge-zone" style={{ color: zone.color }}>{zone.label}</div>
        </div>
      </div>
      <div className="risk-gauge-panel" style={{ borderLeftColor: zone.color }}>
        {zone.message}
      </div>
      <div className="risk-gauge-hint">Drag the handle to explore other risk levels</div>
    </div>
  );
}
