import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Step definitions
───────────────────────────────────────────────────────────────────────────── */
interface TutorialStep {
  /** data-tutorial="<target>" on the element to spotlight, or undefined for centred card */
  target?: string;
  title: string;
  body: string;
  /** Which side of the spotlight the tooltip card appears on */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional action hint shown below the body text */
  hint?: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to UML→Java!',
    body: 'This 60-second tour walks you through the whole editor. Use the arrows or keyboard ← → to navigate, or press Escape to skip at any time.',
  },
  {
    target: 'diagram-tabs',
    title: 'Diagram Types',
    body: 'Choose what kind of diagram to build. Each type maps to a specific code output:\nClass → Java / Kotlin / Python\nFlowchart → pseudocode / Java\nER → Oracle DDL / MySQL / PostgreSQL\nSequence & Activity diagrams too.',
    side: 'bottom',
    hint: 'Try switching tabs to explore.',
  },
  {
    target: 'palette',
    title: 'Shape Palette',
    body: 'Drag any shape from here onto the canvas — or just click it to drop it at the centre. Each diagram type shows its own relevant shapes.',
    side: 'right',
    hint: 'Try dragging a shape to the canvas.',
  },
  {
    target: 'canvas',
    title: 'The Canvas',
    body: 'This is your working area. Drag nodes to reposition them. Connect two nodes by dragging from a blue handle on one to the handle on another. Double-click empty space to add a node instantly.',
    side: 'top',
    hint: 'Double-click an empty spot to add a node.',
  },
  {
    target: 'properties-panel',
    title: 'Properties Panel',
    body: 'Click any node on the canvas to select it, then edit its name, type, fields, and methods right here. Every change immediately affects the generated code.',
    side: 'left',
    hint: 'Click a node to see its properties.',
  },
  {
    target: 'generate-btn',
    title: 'Generate Code',
    body: 'When your diagram looks good, click Generate. A syntax-highlighted code panel opens on the right side — copy it straight to your IDE.',
    side: 'bottom',
    hint: 'Click Generate after you add some nodes.',
  },
  {
    title: "You're all set!",
    body: "Start with a Class diagram — drag a Class node onto the canvas, fill in some fields in the Properties panel, then hit Generate. Happy coding!",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Spotlight rect type
───────────────────────────────────────────────────────────────────────────── */
interface SpotRect { top: number; left: number; width: number; height: number }

function getSpotRect(target: string): SpotRect | null {
  const el = document.querySelector(`[data-tutorial="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Tooltip card position helpers
───────────────────────────────────────────────────────────────────────────── */
const CARD_W = 320;
const CARD_GAP = 14;

function tooltipStyle(
  side: 'top' | 'bottom' | 'left' | 'right',
  spot: SpotRect,
): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (side) {
    case 'bottom': {
      const left = Math.min(
        Math.max(16, spot.left + spot.width / 2 - CARD_W / 2),
        vw - CARD_W - 16,
      );
      return { top: Math.min(spot.top + spot.height + CARD_GAP, vh - 200), left };
    }
    case 'top': {
      const left = Math.min(
        Math.max(16, spot.left + spot.width / 2 - CARD_W / 2),
        vw - CARD_W - 16,
      );
      return { bottom: vh - spot.top + CARD_GAP, left };
    }
    case 'right': {
      const top = Math.min(
        Math.max(16, spot.top + spot.height / 2 - 80),
        vh - 220,
      );
      return { top, left: Math.min(spot.left + spot.width + CARD_GAP, vw - CARD_W - 16) };
    }
    case 'left': {
      const top = Math.min(
        Math.max(16, spot.top + spot.height / 2 - 80),
        vh - 220,
      );
      return { top, right: vw - spot.left + CARD_GAP };
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
interface Props { onClose: () => void }

export default function TutorialOverlay({ onClose }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [spot, setSpot]       = useState<SpotRect | null>(null);
  const [visible, setVisible] = useState(false);

  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast  = stepIdx === STEPS.length - 1;

  /* Resolve spotlight rect for the current step */
  const resolveSpot = useCallback(() => {
    if (!step.target) { setSpot(null); return; }
    const r = getSpotRect(step.target);
    setSpot(r ?? null);
  }, [step.target]);

  /* Re-resolve on resize */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resolveSpot();
    const onResize = () => resolveSpot();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [resolveSpot]);

  /* Fade-in on mount */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  /* Re-animate card when step changes */
  const [cardKey, setCardKey] = useState(0);
  const goTo = useCallback((idx: number) => {
    setStepIdx(idx);
    setCardKey(k => k + 1);
  }, []);

  const prev = () => { if (!isFirst) goTo(stepIdx - 1); };
  const next = () => { if (!isLast) goTo(stepIdx + 1); else onClose(); };

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── Progress dots ── */
  const dots = STEPS.map((_, i) => (
    <div
      key={i}
      onClick={() => goTo(i)}
      style={{
        width: i === stepIdx ? 20 : 6,
        height: 6,
        borderRadius: 3,
        background: i === stepIdx ? '#f97316' : 'rgba(255,255,255,0.18)',
        cursor: 'pointer',
        transition: 'all 0.25s',
      }}
    />
  ));

  /* ── Tooltip card contents ── */
  const card = (
    <div
      key={cardKey}
      style={{
        position: 'fixed',
        zIndex: 10010,
        width: CARD_W,
        background: '#0a0f1e',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 14,
        padding: '22px 22px 18px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.08)',
        ...(spot && step.side
          ? {
              animation: 'tutCardIn 0.28s cubic-bezier(0.22,1,0.36,1) both',
              ...tooltipStyle(step.side, spot),
            }
          : {
              animation: 'tutCardInCenter 0.28s cubic-bezier(0.22,1,0.36,1) both',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }),
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Step count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#f97316', letterSpacing: 0.8 }}>
          STEP {stepIdx + 1} OF {STEPS.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Skip tutorial"
          style={{
            background: 'transparent', border: 'none',
            color: '#334155', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#334155'; }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${((stepIdx + 1) / STEPS.length) * 100}%`,
          background: 'linear-gradient(90deg,#f97316,#fbbf24)',
          borderRadius: 2,
          transition: 'width 0.35s ease',
        }} />
      </div>

      {/* Title */}
      <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
        {step.title}
      </h3>

      {/* Body */}
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
        {step.body}
      </p>

      {/* Hint */}
      {step.hint && (
        <div style={{
          background: 'rgba(249,115,22,0.07)',
          border: '1px solid rgba(249,115,22,0.18)',
          borderRadius: 8,
          padding: '7px 12px',
          marginBottom: 16,
          fontSize: 11,
          color: '#f97316',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {step.hint}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: step.hint ? 0 : 4 }}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>{dots}</div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {!isFirst && (
            <button
              onClick={prev}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#94a3b8',
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={next}
            style={{
              background: isLast ? '#f97316' : 'linear-gradient(135deg,#f97316,#ea580c)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              padding: '7px 18px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 0 14px rgba(249,115,22,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 22px rgba(249,115,22,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 14px rgba(249,115,22,0.35)'; e.currentTarget.style.transform = 'none'; }}
          >
            {isLast ? 'Start Building' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Backdrop (click to skip) ── */
  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes tutCardIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes tutCardInCenter {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes spotFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Dark overlay — covers everything, click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 10003,
          background: 'rgba(0,0,0,0)',
          pointerEvents: spot ? 'auto' : 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Spotlight highlight box */}
      {spot && (
        <div
          style={{
            position: 'fixed',
            zIndex: 10004,
            top: spot.top - 4,
            left: spot.left - 4,
            width: spot.width + 8,
            height: spot.height + 8,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 2px #f97316, 0 0 28px rgba(249,115,22,0.35)',
            pointerEvents: 'none',
            animation: 'spotFadeIn 0.3s ease both',
          }}
        />
      )}

      {/* No-spotlight overlay (for welcome / done steps) */}
      {!spot && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            zIndex: 10005,
            background: 'rgba(0,0,0,0.72)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* Tooltip card */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10009, pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            {card}
          </div>
        </div>
      </div>
    </>
  );
}
