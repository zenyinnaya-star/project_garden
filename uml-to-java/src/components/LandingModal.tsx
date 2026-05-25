import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DiagramIcon, DatabaseIcon, SparkleIcon, XIcon } from './Icons';

interface Props { onClose: () => void; }

/* ─── demo code ─────────────────────────────────────────────────── */
const DEMO_CODE = [
  'public class Order {',
  '  private Long id;',
  '  private Customer customer;',
  '  private List<OrderItem> items;',
  '',
  '  public Order(Customer customer) {',
  '    this.customer = customer;',
  '    this.items = new ArrayList<>();',
  '  }',
  '',
  '  public void addItem(OrderItem item) {',
  '    this.items.add(item);',
  '  }',
  '}',
];

/* ─── inline SVG icons (no emoji) ──────────────────────────────── */
const IcoCrosshair = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
    <line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/>
    <line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>
  </svg>
);
const IcoBolt = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcoSync = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);
const IcoRocket = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);
const IcoShield = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IcoCode = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IcoUsers = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoStar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoCrown = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M5 20V10l7-7 7 7v10"/>
    <polyline points="5 10 2 7"/><polyline points="19 10 22 7"/>
  </svg>
);

/* ─── hooks ─────────────────────────────────────────────────────── */
function useTypewriter(lines: string[], speedMs = 28): string {
  const full = lines.join('\n');
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (pos >= full.length) return;
    const t = setTimeout(() => setPos(p => p + 1), speedMs);
    return () => clearTimeout(t);
  }, [pos, full, speedMs]);
  return full.slice(0, pos);
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    const el = ref.current; if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── sub-components ────────────────────────────────────────────── */
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const id = setInterval(() => {
      frame++; setCount(Math.round((frame / 55) * target));
      if (frame >= 55) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const el = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!el.current) return;
    const r = el.current.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: -((e.clientY - r.top) / r.height - 0.5) * 16 });
  }, []);
  return (
    <div ref={el} onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      style={{ ...style,
        transform: `perspective(700px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale(${hovered ? 1.04 : 1})`,
        transition: hovered ? 'transform 0.05s linear,box-shadow 0.2s' : 'transform 0.55s ease,box-shadow 0.3s',
        transformStyle: 'preserve-3d', willChange: 'transform',
      }}
    >{children}</div>
  );
}

function RippleButton({ onClick, children, style, variant = 'primary' }: {
  onClick?: () => void; children: React.ReactNode;
  style?: React.CSSProperties; variant?: 'primary' | 'ghost';
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = btnRef.current!.getBoundingClientRect();
    const id = Date.now();
    setRipples(rr => [...rr, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples(rr => rr.filter(rp => rp.id !== id)), 700);
    onClick?.();
  };
  const ip = variant === 'primary';
  return (
    <button ref={btnRef} onClick={handleClick} style={{
      position: 'relative', overflow: 'hidden',
      padding: '14px 36px', borderRadius: 12,
      border: ip ? 'none' : '1.5px solid rgba(99,102,241,0.45)',
      background: ip ? 'linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%)' : 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(10px)', color: '#fff', fontSize: 15, fontWeight: 700,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9,
      transition: 'transform 0.2s,box-shadow 0.2s',
      boxShadow: ip ? '0 0 24px rgba(99,102,241,0.45),0 4px 24px rgba(0,0,0,0.4)' : 'none',
      ...style,
    }}
      onMouseEnter={e => { const b = e.currentTarget; b.style.transform = 'translateY(-3px) scale(1.03)'; if (ip) b.style.boxShadow = '0 0 40px rgba(99,102,241,0.75),0 8px 32px rgba(0,0,0,0.5)'; else { b.style.background = 'rgba(99,102,241,0.12)'; b.style.borderColor = 'rgba(99,102,241,0.8)'; } }}
      onMouseLeave={e => { const b = e.currentTarget; b.style.transform = 'none'; if (ip) b.style.boxShadow = '0 0 24px rgba(99,102,241,0.45),0 4px 24px rgba(0,0,0,0.4)'; else { b.style.background = 'rgba(255,255,255,0.04)'; b.style.borderColor = 'rgba(99,102,241,0.45)'; } }}
    >
      {ripples.map(rp => (
        <span key={rp.id} style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', width: 80, height: 80, left: rp.x - 40, top: rp.y - 40, background: 'rgba(255,255,255,0.28)', animation: 'ripple 0.7s ease-out forwards' }} />
      ))}
      {children}
    </button>
  );
}

function Section({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(36px)', transition: `opacity 0.7s ease ${delay}ms,transform 0.7s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function colorize(line: string): React.ReactNode {
  const kwRe = /\b(public|private|protected|class|interface|void|new|return|this|extends|implements|static|final)\b/g;
  const tyRe = /\b(Long|String|int|boolean|List|ArrayList|Customer|OrderItem|Order)\b/g;
  const tokens: { index: number; length: number; color: string }[] = [];
  let m: RegExpExecArray | null;
  const kw = new RegExp(kwRe.source, 'g'); while ((m = kw.exec(line)) !== null) tokens.push({ index: m.index, length: m[0].length, color: '#c084fc' });
  const ty = new RegExp(tyRe.source, 'g'); while ((m = ty.exec(line)) !== null) if (!tokens.some(t => t.index === m!.index)) tokens.push({ index: m.index, length: m[0].length, color: '#60a5fa' });
  tokens.sort((a, b) => a.index - b.index);
  const parts: React.ReactNode[] = []; let last = 0;
  for (const tok of tokens) {
    if (tok.index > last) parts.push(<span key={last} style={{ color: '#94a3b8' }}>{line.slice(last, tok.index)}</span>);
    parts.push(<span key={tok.index} style={{ color: tok.color }}>{line.slice(tok.index, tok.index + tok.length)}</span>);
    last = tok.index + tok.length;
  }
  if (last < line.length) parts.push(<span key={last} style={{ color: '#94a3b8' }}>{line.slice(last)}</span>);
  return parts.length ? parts : <span style={{ color: '#94a3b8' }}>{line}</span>;
}

/* ─── floating shape helper ─────────────────────────────────────── */
function FloatShape({ style, anim, inner }: { style: React.CSSProperties; anim: string; inner?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', pointerEvents: 'none', animation: anim, ...style }}>
      {inner && <div style={inner}/>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function LandingModal({ onClose }: Props) {
  const code = useTypewriter(DEMO_CODE, 28);
  const codeLines = code.split('\n');

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 32, paddingBottom: 48, overflowY: 'auto',
      animation: 'fadeIn 0.35s ease both',
      fontFamily: 'system-ui,-apple-system,sans-serif',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(920px,94vw)',
        background: 'linear-gradient(160deg,#080f1e 0%,#060b18 60%,#09101f 100%)',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20,
        position: 'relative', overflow: 'hidden',
        animation: 'slideInDown 0.5s ease both',
        boxShadow: '0 0 0 1px rgba(99,102,241,0.08),0 40px 80px rgba(0,0,0,0.7)',
      }}>

        {/* ── ambient background ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(99,102,241,0.12) 1px,transparent 1px)', backgroundSize: '30px 30px', animation: 'gridFade 6s ease-in-out infinite' }}/>
          <div style={{ position: 'absolute', top: -120, left: -80, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.22) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'orb 12s ease-in-out infinite' }}/>
          <div style={{ position: 'absolute', bottom: -100, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.20) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'orb2 15s ease-in-out infinite' }}/>
          <div style={{ position: 'absolute', top: '40%', right: '10%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 70%)', filter: 'blur(30px)', animation: 'orb 18s ease-in-out infinite reverse' }}/>
        </div>

        {/* ── close ── */}
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, zIndex: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', padding: '7px 9px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#f1f5f9'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}>
          <XIcon size={12}/>
        </button>

        {/* ══════════════════════════════
            FULL VERSION COMING SOON BANNER
        ══════════════════════════════ */}
        <div style={{
          position: 'relative', zIndex: 1,
          background: 'linear-gradient(90deg,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.18) 50%,rgba(6,182,212,0.12) 100%)',
          borderBottom: '1px solid rgba(99,102,241,0.2)',
          padding: '11px 24px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.5s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a5b4fc' }}>
            <IcoStar size={14} color="#fbbf24"/>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Full version coming soon</span>
          </div>
          <span style={{ color: '#475569', fontSize: 12 }}>—</span>
          <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>
            Team collaboration · Version history · CI/CD export · Custom templates · Cloud save
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
            <IcoCrown size={11} color="#a5b4fc"/>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc' }}>BETA</span>
          </div>
        </div>

        {/* ══════════════════════════════
            HERO
        ══════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1, padding: '52px 48px 44px', overflow: 'hidden', minHeight: 360 }}>
          {/* 3D floating shapes */}
          <FloatShape anim="float 8s ease-in-out infinite" style={{ top: 28, right: 58, opacity: 0.7 }}
            inner={{ width: 56, height: 56, border: '2px solid rgba(99,102,241,0.55)', borderRadius: 12, background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.06))', transform: 'perspective(200px) rotateX(28deg) rotateY(28deg)', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}/>
          <FloatShape anim="float2 11s ease-in-out infinite" style={{ top: 78, right: 148, opacity: 0.5 }}>
            <div style={{ animation: 'rotateSlow 20s linear infinite', width: 38, height: 38, border: '1.5px solid rgba(139,92,246,0.6)', borderRadius: 4, transform: 'rotate(45deg)', background: 'rgba(139,92,246,0.06)', boxShadow: '0 0 14px rgba(139,92,246,0.2)' }}/>
          </FloatShape>
          <FloatShape anim="float3 13s ease-in-out infinite" style={{ top: 140, right: 78, opacity: 0.45 }}
            inner={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.7)', boxShadow: '0 0 12px rgba(6,182,212,0.3)' }}/>
          <FloatShape anim="float 9s ease-in-out infinite 2s" style={{ top: 18, right: 238, opacity: 0.3 }}>
            <div style={{ animation: 'rotateSlowRev 25s linear infinite', width: 50, height: 50, border: '1px solid rgba(99,102,241,0.35)', borderRadius: '50%' }}>
              <div style={{ position: 'absolute', inset: 7, border: '1px dashed rgba(99,102,241,0.25)', borderRadius: '50%' }}/>
            </div>
          </FloatShape>
          <FloatShape anim="float2 7s ease-in-out infinite 1s" style={{ bottom: 38, right: 98, opacity: 0.45 }}
            inner={{ width: 26, height: 26, background: 'rgba(37,99,235,0.12)', border: '1.5px solid rgba(37,99,235,0.45)', borderRadius: 4, transform: 'perspective(100px) rotateX(20deg) rotateY(20deg)' }}/>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 40, padding: '5px 14px', marginBottom: 20, animation: 'fadeInUp 0.6s ease both' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', boxShadow: '0 0 8px #6366f1' }}/>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', letterSpacing: 0.5 }}>Visual UML Design · Java &amp; Oracle DDL Generator</span>
          </div>

          {/* H1 */}
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, lineHeight: 1.18, color: '#f1f5f9', animation: 'fadeInUp 0.6s ease 120ms both', maxWidth: 560 }}>
            Turn Business Plans<br/>into{' '}
            <span style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 4s linear infinite' }}>
              Working Code
            </span>
          </h1>

          <p style={{ margin: '0 0 30px', fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 480, animation: 'fadeInUp 0.6s ease 220ms both' }}>
            Draw UML class diagrams, flowcharts, or ER schemas on a visual canvas — click <strong style={{ color: '#94a3b8' }}>Generate</strong> and get clean Java classes or Oracle DDL instantly.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'fadeInUp 0.6s ease 320ms both' }}>
            <RippleButton onClick={onClose}>
              Start Building
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </RippleButton>
            <RippleButton variant="ghost" onClick={() => document.getElementById('lp-how')?.scrollIntoView({ behavior: 'smooth' })}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              See How It Works
            </RippleButton>
          </div>

          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', animation: 'fadeInUp 0.6s ease 800ms both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.3 }}>
            <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: 1 }}>SCROLL</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* ══════════════════════════════
            STATS
        ══════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(99,102,241,0.12)', borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.04)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { value: 1, suffix: 's', label: 'Code generation time', prefix: '< ' },
            { value: 3, suffix: '', label: 'Diagram types supported', prefix: '' },
            { value: 100, suffix: '%', label: 'Runs in your browser', prefix: '' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '22px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(99,102,241,0.1)' : 'none' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#e2e8f0', lineHeight: 1, animation: 'textGlow 4s ease-in-out infinite' }}>
                <Counter target={s.value} suffix={s.suffix} prefix={s.prefix}/>
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════
            ABOUT
        ══════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1, padding: '56px 48px' }}>
          <Section>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>About</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
              <div>
                <h2 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>The gap between design and code costs you time</h2>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b', lineHeight: 1.75 }}>
                  Architects draw class diagrams. Developers hand-type boilerplate. Business analysts describe flows. Everyone has their own format — something always gets lost in translation.
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.75 }}>
                  <strong style={{ color: '#94a3b8' }}>UML→Java</strong> closes that gap. Your visual design <em>is</em> the code.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { Icon: IcoCrosshair, color: '#6366f1', title: 'Visual-first design', desc: 'Model your system as stakeholders understand it — visually, not in code.' },
                  { Icon: IcoBolt,      color: '#fbbf24', title: 'Instant code output', desc: 'No copy-pasting, no boilerplate — click Generate and ship.' },
                  { Icon: IcoSync,      color: '#34d399', title: 'Two-way import',      desc: 'Already have Java or Oracle DDL? Drop it in and get a diagram back.' },
                ].map(item => (
                  <div key={item.title}
                    style={{ display: 'flex', gap: 13, alignItems: 'flex-start', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 10, padding: '13px 15px', transition: 'border-color 0.2s,background 0.2s', cursor: 'default' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.35)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.14)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.06)'; }}
                  >
                    <div style={{ color: item.color, flexShrink: 0, marginTop: 1 }}><item.Icon size={20} color={item.color}/></div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* ══════════════════════════════
            HOW IT WORKS
        ══════════════════════════════ */}
        <div id="lp-how" style={{ position: 'relative', zIndex: 1, padding: '0 48px 56px' }}>
          <Section>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>How it works</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Three steps from sketch to code</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0 }}>
              {[
                { n: '01', color: '#6366f1', bg: 'rgba(99,102,241,0.12)',
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="8" x2="14" y2="8"/><line x1="8" y1="16" x2="11" y2="16"/></svg>,
                  title: 'Design on canvas', desc: 'Drag Class, Interface, Flowchart, or ER nodes onto the canvas. Set fields, attributes, and relationships visually.' },
                { n: '02', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
                  title: 'Generate code', desc: 'Click "Generate Code" and get production-ready Java classes or Oracle DDL with constraints, types, and relationships.' },
                { n: '03', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
                  title: 'Copy & ship', desc: 'One-click copy. Paste directly into your IDE or SQL client. Your architecture is now ready-to-run code.' },
              ].map((step, i) => (
                <React.Fragment key={step.n}>
                  <TiltCard style={{ flex: 1, maxWidth: 240 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px', background: step.bg, border: `1px solid ${step.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color, boxShadow: `0 0 16px ${step.color}30` }}>{step.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: step.color, letterSpacing: 1, marginBottom: 7 }}>STEP {step.n}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{step.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.65 }}>{step.desc}</div>
                    </div>
                  </TiltCard>
                  {i < 2 && (
                    <div style={{ flexShrink: 0, width: 40, marginTop: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ height: 1, width: '100%', background: 'linear-gradient(to right,rgba(99,102,241,0.5),rgba(139,92,246,0.5))' }}/>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="rgba(139,92,246,0.6)" style={{ marginLeft: 32 }}><polygon points="0,0 8,4 0,8"/></svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Section>
        </div>

        {/* ══════════════════════════════
            WHY IT WORKS
        ══════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1, padding: '56px 48px', background: 'rgba(99,102,241,0.03)', borderTop: '1px solid rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <Section>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Why it works</div>
              <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>Accelerate from business plan to working code</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.7, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
                Whether you're translating stakeholder requirements, architecting a new service, or reverse-engineering a legacy system — UML→Java shortens every step.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(195px,1fr))', gap: 16 }}>
              {[
                { Icon: IcoRocket, color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  title: '10× Faster Delivery',       desc: 'A class diagram that takes 40 min to hand-code generates in seconds.',          metric: '40 min → 30 sec' },
                { Icon: IcoShield, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', title: 'Zero Translation Errors',    desc: 'The diagram IS the spec. What you see is exactly what gets built.',            metric: '100% spec fidelity' },
                { Icon: IcoCode,   color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.2)',  title: 'Consistent Patterns',        desc: 'Every generated class follows the same naming, visibility & structure.',       metric: 'Convention-first' },
                { Icon: IcoUsers,  color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', title: 'Stakeholder Alignment',      desc: 'Business sees the diagram. Devs see the code. Both from one source of truth.',metric: 'One source of truth' },
              ].map(card => (
                <TiltCard key={card.title} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${card.border}`, borderRadius: 14, padding: '22px 18px', cursor: 'default', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                  <div style={{ color: card.color, marginBottom: 12 }}><card.Icon size={22} color={card.color}/></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: card.color, marginBottom: 7 }}>{card.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.65, marginBottom: 12 }}>{card.desc}</div>
                  <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: card.bg, color: card.color, border: `1px solid ${card.border}`, padding: '3px 9px', borderRadius: 20 }}>{card.metric}</div>
                </TiltCard>
              ))}
            </div>
          </Section>
        </div>

        {/* ══════════════════════════════
            FEATURES
        ══════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1, padding: '56px 48px' }}>
          <Section>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>What you can build</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Everything your architecture needs</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 14 }}>
              {[
                { icon: <DiagramIcon size={24}/>, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  title: 'Class → Java',      badge: 'OOP',      desc: 'Classes, interfaces, abstract types, inheritance, composition.' },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,8 22,16 12,22 2,16 2,8"/></svg>,
                                                  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.2)',  title: 'Flowchart → Java',  badge: 'Logic',    desc: 'Control flow as readable Java methods with branching.' },
                { icon: <DatabaseIcon size={24}/>, color: '#c4b5fd', bg: 'rgba(196,181,253,0.1)',border: 'rgba(196,181,253,0.2)', title: 'ER → Oracle DDL',   badge: 'Database', desc: 'Tables, PKs, FKs, VARCHAR2, NUMBER — full Oracle syntax.' },
                { icon: <SparkleIcon size={24}/>,  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)',  title: 'AI Import',         badge: 'GPT-4o',   desc: 'Describe a system or upload a diagram — AI builds the canvas.' },
              ].map(card => (
                <TiltCard key={card.title} style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${card.border}`, borderRadius: 14, padding: '22px 18px', cursor: 'default' }}>
                  <div style={{ color: card.color, marginBottom: 12 }}>{card.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 7 }}>{card.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.65, marginBottom: 12 }}>{card.desc}</div>
                  <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: card.bg, color: card.color, border: `1px solid ${card.border}`, padding: '2px 9px', borderRadius: 20 }}>{card.badge}</div>
                </TiltCard>
              ))}

              {/* ── Professional Mode coming soon card ── */}
              <TiltCard style={{
                background: 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(99,102,241,0.08) 100%)',
                border: '1px solid rgba(139,92,246,0.35)',
                borderRadius: 14, padding: '22px 18px', cursor: 'default',
                boxShadow: '0 0 24px rgba(139,92,246,0.08)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Shimmer bar across top */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)', animation: 'shimmer 3s linear infinite', backgroundSize: '200% auto' }}/>
                <div style={{ color: '#a78bfa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IcoCrown size={24} color="#a78bfa"/>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(90deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COMING SOON</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 7 }}>Professional Mode</div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.65, marginBottom: 12 }}>Team workspaces, version history, CI/CD hooks, custom code templates &amp; cloud sync.</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Teams','Git sync','CI/CD'].map(t => (
                    <span key={t} style={{ fontSize: 9, fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '2px 7px', borderRadius: 20 }}>{t}</span>
                  ))}
                </div>
              </TiltCard>
            </div>
          </Section>
        </div>

        {/* ══════════════════════════════
            CODE PREVIEW
        ══════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 48px 56px' }}>
          <Section>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Live preview</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>See your diagram become code</h2>
            </div>
            <div style={{ background: '#050b15', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(99,102,241,0.06)' }}>
              <div style={{ height: 38, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 7 }}>
                {['#f87171','#fbbf24','#4ade80'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.8 }}/>)}
                <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#475569', fontFamily: 'monospace', marginRight: 44 }}>Order.java — generated by UML→Java</div>
              </div>
              <div style={{ padding: '22px 28px', fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8, minHeight: 220 }}>
                {codeLines.map((line, i) => <div key={i}>{line === '' ? <br/> : colorize(line)}</div>)}
                <span style={{ animation: 'cursorBlink 1s step-end infinite', color: '#6366f1', fontWeight: 300, fontSize: 15 }}>|</span>
              </div>
            </div>
          </Section>
        </div>

        {/* ══════════════════════════════
            FOOTER CTA
        ══════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 48px 52px', textAlign: 'center', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
          <Section>
            <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, color: '#f1f5f9' }}>Ready to accelerate your workflow?</h2>
            <p style={{ margin: '0 0 28px', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>Free. No account needed. Runs entirely in your browser.</p>
            <RippleButton onClick={onClose} style={{ fontSize: 16, padding: '16px 48px' }}>
              Start Building for Free
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </RippleButton>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              {['Free forever','No signup','Open source friendly'].map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155', display: 'inline-block' }}/>}
                  <span style={{ fontSize: 11, color: '#475569' }}>{t}</span>
                </React.Fragment>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
