import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 70;
const LINK_DIST = 120;
const BASE_COLOR = [59, 130, 246];
// Same 4-state mapping used for the card rising-fill effect, so the
// background and the cards shift to match the diagnosis together.
const DX_COLOR = {
  hypothyroid: [239, 68, 68],
  borderline_hypo: [245, 158, 11],
  borderline_hyper: [245, 158, 11],
  hyperthyroid: [245, 158, 11],
  optimal: [16, 185, 129],
};
const TRANSITION_MS = 2000;

export default function Background({ dx }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const colorRef = useRef({ from: BASE_COLOR, to: BASE_COLOR, current: BASE_COLOR, start: 0 });

  useEffect(() => {
    const target = dx && DX_COLOR[dx] ? DX_COLOR[dx] : BASE_COLOR;
    const c = colorRef.current;
    colorRef.current = { from: c.current || BASE_COLOR, to: target, current: c.current, start: performance.now() };
  }, [dx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    let w = window.innerWidth;
    let h = window.innerHeight;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.3;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random(),
      };
    });

    function currentColor(now) {
      const { from, to, start } = colorRef.current;
      const t = Math.min(1, (now - start) / TRANSITION_MS);
      const c = [0, 1, 2].map((i) => Math.round(from[i] + (to[i] - from[i]) * t));
      colorRef.current.current = c;
      return c;
    }

    function frame(now) {
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = currentColor(now);
      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const bp = particles[j];
          const dx2 = a.x - bp.x;
          const dy2 = a.y - bp.y;
          const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist < LINK_DIST) {
            const alpha = 0.1 * (1 - dist / LINK_DIST);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(bp.x, bp.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = `rgba(${r},${g},${b},0.4)`;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    if (reduced) {
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mesh-bg" aria-hidden="true">
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />
      <canvas ref={canvasRef} className="particle-canvas" />
      <div className="mesh-grid-overlay" />
      <div className="mesh-vignette" />
    </div>
  );
}
