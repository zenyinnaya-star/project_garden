import { useEffect, useRef } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Star  { x: number; y: number; r: number; phase: number; spd: number }
interface Mote  { x: number; y: number; vx: number; vy: number; alpha: number; r: number }

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function BlackHoleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    /* ── State ────────────────────────────────────────────────────────────── */
    let raf: number;
    let t = 0;

    const STAR_COUNT = 260;
    const MOTE_COUNT = 55;

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      r: rand(0.25, 1.5),
      phase: rand(0, Math.PI * 2),
      spd:  rand(0.4, 1.2),
    }));

    /* Motes — tiny particles spiralling into the BH */
    const motes: Mote[] = Array.from({ length: MOTE_COUNT }, () => ({
      x: rand(0, 1), y: rand(0, 1),
      vx: rand(-0.0003, 0.0003), vy: rand(-0.0003, 0.0003),
      alpha: rand(0.15, 0.7),
      r: rand(0.6, 1.8),
    }));

    /* ── Resize ───────────────────────────────────────────────────────────── */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ══════════════════════════════════════════════════════════════════════
       DRAW LOOP
    ══════════════════════════════════════════════════════════════════════ */
    const draw = () => {
      t++;
      const W = canvas.width;
      const H = canvas.height;

      /* Black hole centre sits at roughly visual centre, slightly high */
      const cx = W * 0.5;
      const cy = H * 0.46;

      /* Scale all radii to the shorter canvas dimension */
      const base = Math.min(W, H);
      const R    = base * 0.115;   // event-horizon shadow radius
      const PR   = R   * 1.115;    // photon-ring radius

      /* Accretion-disk ellipse geometry (tilted ~15°) */
      const DA   = R * 2.85;       // semi-major (horizontal)
      const DB   = R * 0.42;       // semi-minor (gives the foreshortening)
      const TILT = -0.16;          // slight counter-clockwise tilt (radians)

      /* ── 1. Background ────────────────────────────────────────────────── */
      ctx.fillStyle = '#000610';
      ctx.fillRect(0, 0, W, H);

      /* ── 2. Deep-space nebula gradient ───────────────────────────────── */
      {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.72);
        g.addColorStop(0.0, 'rgba(4,12,38,0.0)');
        g.addColorStop(0.4, 'rgba(5,14,42,0.22)');
        g.addColorStop(1.0, 'rgba(0,2,14,0.55)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      /* ── 3. Stars ─────────────────────────────────────────────────────── */
      stars.forEach(s => {
        const a = 0.22 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.008 * s.spd + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,225,255,${a.toFixed(3)})`;
        ctx.fill();
      });

      /* ── 4. Lensing-stream arcs ───────────────────────────────────────
         Long, thin curved "light trails" that represent photon paths bent
         by the black hole's gravity. They flow from far away and curve
         tightly around the photon ring, just like in the reference image. */
      ctx.save();
      const streams = [
        /* [startX fraction, startY fraction, cp1xF, cp1yF, cp2xF, cp2yF, endDX, endDY, alpha, width] */
        /* top cluster */
        [-0.06, -0.02,  0.02, 0.22, 0.08, 0.36,  PR * 0.35, -PR * 0.85, 0.22, 1.2],
        [ 0.02,  0.00,  0.04, 0.18, 0.07, 0.32,  PR * 0.65, -PR * 0.65, 0.18, 0.9],
        [ 0.10, -0.01,  0.08, 0.16, 0.06, 0.30,  PR * 0.9,  -PR * 0.55, 0.14, 0.7],
        [ 0.18,  0.00,  0.14, 0.14, 0.08, 0.28,  PR * 1.1,  -PR * 0.35, 0.10, 0.6],
        /* bottom cluster */
        [ 0.06,  1.02,  0.07, 0.80, 0.05, 0.68,  PR * 0.50,  PR * 0.88, 0.20, 1.2],
        [ 0.14,  1.00,  0.10, 0.82, 0.06, 0.68,  PR * 0.80,  PR * 0.70, 0.15, 0.9],
        [ 0.22,  1.01,  0.16, 0.82, 0.08, 0.68,  PR * 1.0,   PR * 0.50, 0.11, 0.7],
        /* left edge thin wisps */
        [-0.10,  0.38, -0.02, 0.40, 0.04, 0.42, -PR * 0.8,   0,          0.10, 0.7],
        [-0.08,  0.52, -0.01, 0.50, 0.04, 0.50, -PR * 0.75,  0,          0.09, 0.6],
      ] as const;

      streams.forEach(([sxF, syF, cp1xF, cp1yF, cp2xF, cp2yF, eDX, eDY, alpha, lw]) => {
        const sx   = cx + (sxF  - 0.5) * W;
        const sy   = cy + (syF  - 0.5) * H;
        const cp1x = cx + (cp1xF - 0.5) * W;
        const cp1y = cy + (cp1yF - 0.5) * H;
        const cp2x = cx + (cp2xF - 0.5) * W;
        const cp2y = cy + (cp2yF - 0.5) * H;
        const ex   = cx + eDX;
        const ey   = cy + eDY;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
        ctx.strokeStyle = `rgba(170,200,255,${(alpha * (0.85 + 0.15 * Math.sin(t * 0.004))).toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.stroke();
      });
      ctx.restore();

      /* ── 5. Outer blue glow ───────────────────────────────────────────── */
      {
        const pulse = 1 + 0.035 * Math.sin(t * 0.0045);
        const g = ctx.createRadialGradient(cx, cy, PR * 0.9, cx, cy, PR * 5.5 * pulse);
        g.addColorStop(0.0, 'rgba(55,110,220,0.22)');
        g.addColorStop(0.3, 'rgba(35, 80,180,0.12)');
        g.addColorStop(0.7, 'rgba(18, 45,120,0.06)');
        g.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      /* ── 6. Accretion disk — RIGHT side (bright, blue-white) ─────────── */
      /* The right arc is the gravitationally-lensed far side of the disk:
         it appears much brighter and more complete thanks to photons bending
         all the way around the black hole to reach the observer. */
      const diskLayers = [
        /* [relRadius, startAng, endAng, colorA, colorB, lineWidth, globalAlpha] */
        /* Very outer soft halo */
        [1.30, -Math.PI*0.72, Math.PI*0.72, 'rgba(60,120,220,0.10)', null, DA*0.18, 1.0],
        /* Broad outer ring */
        [1.16, -Math.PI*0.68, Math.PI*0.68, 'rgba(100,165,240,0.30)', null, DA*0.11, 1.0],
        /* Middle ring */
        [1.06, -Math.PI*0.64, Math.PI*0.64, 'rgba(160,200,255,0.55)', null, DA*0.07, 1.0],
        /* Inner bright arc */
        [1.00, -Math.PI*0.60, Math.PI*0.60, 'rgba(215,232,255,0.85)', null, DA*0.04, 1.0],
        /* Peak brightness arc */
        [0.97, -Math.PI*0.48, Math.PI*0.48, 'rgba(240,248,255,0.95)', null, DA*0.025, 1.0],
      ] as const;

      diskLayers.forEach(([relR, a0, a1, color, , lw]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(TILT);
        ctx.scale(1, DB / DA);
        ctx.beginPath();
        ctx.arc(0, 0, DA * relR, a0, a1, false);
        ctx.restore();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw * (DB / DA); // keep visually consistent after scale
        ctx.stroke();
      });

      /* ── 7. Accretion disk — LEFT side (orange/amber near side) ──────── */
      const nearLayers = [
        [1.30, Math.PI*0.60, Math.PI*1.40, 'rgba(90,25,0,0.18)',   DA*0.14],
        [1.16, Math.PI*0.56, Math.PI*1.44, 'rgba(160,48,4,0.28)',  DA*0.09],
        [1.06, Math.PI*0.52, Math.PI*1.48, 'rgba(215,78,14,0.50)', DA*0.055],
        [1.00, Math.PI*0.48, Math.PI*1.52, 'rgba(240,110,22,0.75)',DA*0.035],
        [0.97, Math.PI*0.46, Math.PI*1.54, 'rgba(255,138,36,0.88)',DA*0.022],
      ] as const;

      nearLayers.forEach(([relR, a0, a1, color, lw]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(TILT);
        ctx.scale(1, DB / DA);
        ctx.beginPath();
        ctx.arc(0, 0, DA * relR, a0, a1, false);
        ctx.restore();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw * (DB / DA);
        ctx.stroke();
      });

      /* ── 8. Relativistic jet (vertical blue streak) ───────────────────── */
      /* Top jet — tapers from BH outward toward screen top */
      {
        const jetPulse = 0.8 + 0.2 * Math.sin(t * 0.007);
        const halfW = PR * 0.14;

        /* Wide soft beam */
        const topBeam = ctx.createLinearGradient(cx, cy - PR, cx, 0);
        topBeam.addColorStop(0.0, `rgba(130,180,255,${(0.50 * jetPulse).toFixed(3)})`);
        topBeam.addColorStop(0.5, `rgba(110,160,240,${(0.20 * jetPulse).toFixed(3)})`);
        topBeam.addColorStop(1.0, 'rgba(80,130,220,0.0)');
        ctx.beginPath();
        ctx.moveTo(cx - halfW * 2.2, cy - PR);
        ctx.lineTo(cx - halfW * 0.3, 0);
        ctx.lineTo(cx + halfW * 0.3, 0);
        ctx.lineTo(cx + halfW * 2.2, cy - PR);
        ctx.closePath();
        ctx.fillStyle = topBeam;
        ctx.fill();

        /* Bright core line */
        const topLine = ctx.createLinearGradient(cx, cy - PR * 1.08, cx, 0);
        topLine.addColorStop(0.0, `rgba(210,230,255,${(0.85 * jetPulse).toFixed(3)})`);
        topLine.addColorStop(0.6, `rgba(180,210,255,${(0.30 * jetPulse).toFixed(3)})`);
        topLine.addColorStop(1.0, 'rgba(160,195,255,0.0)');
        ctx.beginPath();
        ctx.moveTo(cx, cy - PR * 1.08);
        ctx.lineTo(cx, 0);
        ctx.strokeStyle = topLine;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* Bottom jet — slightly dimmer */
      {
        const jetPulse2 = 0.7 + 0.2 * Math.sin(t * 0.007 + 1.4);
        const halfW = PR * 0.12;

        const botBeam = ctx.createLinearGradient(cx, cy + PR, cx, H);
        botBeam.addColorStop(0.0, `rgba(120,170,250,${(0.40 * jetPulse2).toFixed(3)})`);
        botBeam.addColorStop(0.6, `rgba(100,155,230,${(0.14 * jetPulse2).toFixed(3)})`);
        botBeam.addColorStop(1.0, 'rgba(80,130,210,0.0)');
        ctx.beginPath();
        ctx.moveTo(cx - halfW * 2, cy + PR);
        ctx.lineTo(cx - halfW * 0.4, H);
        ctx.lineTo(cx + halfW * 0.4, H);
        ctx.lineTo(cx + halfW * 2, cy + PR);
        ctx.closePath();
        ctx.fillStyle = botBeam;
        ctx.fill();

        const botLine = ctx.createLinearGradient(cx, cy + PR * 1.05, cx, H);
        botLine.addColorStop(0.0, `rgba(200,220,255,${(0.70 * jetPulse2).toFixed(3)})`);
        botLine.addColorStop(0.7, 'rgba(160,195,255,0.15)');
        botLine.addColorStop(1.0, 'rgba(140,180,240,0.0)');
        ctx.beginPath();
        ctx.moveTo(cx, cy + PR * 1.05);
        ctx.lineTo(cx, H);
        ctx.strokeStyle = botLine;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      /* ── 9. Photon-ring glow band ─────────────────────────────────────── */
      {
        const pulse = 1 + 0.04 * Math.sin(t * 0.006);
        const g = ctx.createRadialGradient(cx, cy, PR * 0.80, cx, cy, PR * 1.28 * pulse);
        g.addColorStop(0.0, 'rgba(170,205,255,0.55)');
        g.addColorStop(0.5, 'rgba(120,170,245,0.25)');
        g.addColorStop(1.0, 'rgba(70,130,220,0.0)');
        ctx.beginPath();
        ctx.arc(cx, cy, PR * 1.05, 0, Math.PI * 2);
        ctx.strokeStyle = g;
        ctx.lineWidth = PR * 0.32;
        ctx.stroke();
      }

      /* Crisp bright arc on right edge of photon ring */
      {
        const a = 0.75 + 0.15 * Math.sin(t * 0.005);
        ctx.beginPath();
        ctx.arc(cx, cy, PR, -Math.PI * 0.50, Math.PI * 0.50, false);
        ctx.strokeStyle = `rgba(235,245,255,${a.toFixed(3)})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      /* ── 10. Motes (micro-particles drifting near the disk) ──────────── */
      motes.forEach(m => {
        /* Drift slowly toward BH centre */
        const dx = cx - m.x * W;
        const dy = cy - m.y * H;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > PR * 0.9) {
          m.x += m.vx + dx * 0.000005;
          m.y += m.vy + dy * 0.000005;
        } else {
          /* Reset when it reaches the hole */
          m.x = Math.random();
          m.y = Math.random();
        }

        const a = m.alpha * (0.5 + 0.5 * Math.sin(t * 0.015 + m.r * 3));
        ctx.beginPath();
        ctx.arc(m.x * W, m.y * H, m.r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,218,255,${(a * 0.4).toFixed(3)})`;
        ctx.fill();
      });

      /* ── 11. Black hole shadow ────────────────────────────────────────── */
      {
        const g = ctx.createRadialGradient(cx - R * 0.08, cy - R * 0.06, 0, cx, cy, R * 1.02);
        g.addColorStop(0.0, '#000000');
        g.addColorStop(0.88, '#000000');
        g.addColorStop(1.0,  'rgba(0,0,0,0.65)');
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      /* ── 12. Warm inner-edge glow (accretion disk meets shadow) ──────── */
      {
        const a = 0.30 + 0.10 * Math.sin(t * 0.004 + 1.0);
        const g = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.06);
        g.addColorStop(0.0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, `rgba(210,75,10,${a.toFixed(3)})`);
        g.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = g;
        ctx.lineWidth = R * 0.38;
        ctx.stroke();
      }

      /* ── 13. Final vignette to deepen edges ──────────────────────────── */
      {
        const g = ctx.createRadialGradient(cx, cy, H * 0.28, cx, cy, H * 0.88);
        g.addColorStop(0.0, 'rgba(0,0,0,0)');
        g.addColorStop(1.0, 'rgba(0,0,10,0.55)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
