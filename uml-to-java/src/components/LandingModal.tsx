import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { XIcon } from './Icons';
import BlackHoleBg from './BlackHoleBg';

/* ─── All keyframes ─────────────────────────────────────────────────────────── */
const KEYFRAMES = `
  /* storm bg */
  @keyframes stormOrb  {
    0%,100% { transform:scale(1)    translateY(0px);  opacity:.7;  }
    40%      { transform:scale(1.14) translateY(-44px);opacity:.88; }
    70%      { transform:scale(.93)  translateY(16px); opacity:.6;  }
  }
  @keyframes cloudA {
    0%,100% { transform:translate(-4%,0%) scale(1);    opacity:.38; }
    50%      { transform:translate(5%,-3%)scale(1.06); opacity:.56; }
  }
  @keyframes cloudB {
    0%,100% { transform:translate(3%,2%)  scale(1.02); opacity:.26; }
    50%      { transform:translate(-5%,-2%)scale(.97);  opacity:.44; }
  }
  @keyframes cloudC {
    0%,100% { transform:translate(0%,0%) scale(1);    opacity:.20; }
    50%      { transform:translate(3%,4%)scale(1.04); opacity:.38; }
  }
  @keyframes bolt1 {
    0%,80%,100%{opacity:0}  83%,85%{opacity:.18}  84%{opacity:.06}
  }
  @keyframes bolt2 {
    0%,88%,100%{opacity:0}  90%,93%{opacity:.13}  91%,92%{opacity:.05}
  }
  /* hero content */
  @keyframes heroUp   { from{opacity:0;transform:translateY(36px)}  to{opacity:1;transform:none} }
  @keyframes pillIn   { from{opacity:0;transform:translateY(-14px)scale(.94)} to{opacity:1;transform:none} }
  @keyframes navIn    { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:none} }
  @keyframes shimmerText {
    0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
  }
  @keyframes orbPulse {
    0%,100%{box-shadow:0 0 28px rgba(249,115,22,.4)}
    50%    {box-shadow:0 0 54px rgba(249,115,22,.7)}
  }
  /* 3-D mockup float */
  @keyframes float3d {
    0%,100%{ transform:perspective(1400px) rotateX(-14deg) rotateY(6deg) rotateZ(-1.5deg) translateY(0px);   }
    50%    { transform:perspective(1400px) rotateX(-11deg) rotateY(5deg) rotateZ(-1deg)   translateY(-20px);  }
  }
  /* collab pulses */
  @keyframes avatarPop {
    0%  { transform:scale(0) rotate(-20deg); opacity:0; }
    70% { transform:scale(1.15) rotate(3deg); }
    100%{ transform:scale(1)  rotate(0deg);  opacity:1; }
  }
  @keyframes pingRing {
    0%  { transform:scale(1);   opacity:.7; }
    100%{ transform:scale(2.4); opacity:0;  }
  }
  @keyframes featureCard3d {
    0%,100%{ transform:perspective(900px) rotateX(0deg) rotateY(0deg); }
    25%    { transform:perspective(900px) rotateX(2deg) rotateY(-3deg); }
    75%    { transform:perspective(900px) rotateX(-2deg)rotateY(3deg);  }
  }
  @keyframes sectionFade {
    from{opacity:0;transform:translateY(40px)}
    to  {opacity:1;transform:none}
  }
  @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes typeCode {
    from { width:0 }
    to   { width:100% }
  }
`;

/* ─── Stagger helper ─────────────────────────────────────────────────────────── */
const u = (delay: number, dur = .65): CSSProperties => ({
  animation: `heroUp ${dur}s ease ${delay}ms both`,
});
const sec = (delay: number): CSSProperties => ({
  animation: `sectionFade .7s ease ${delay}ms both`,
});

/* ─── Feature card (3-D tilt on hover) ──────────────────────────────────────── */
function Card3D({ children, accent = '#f97316', delay = 0 }: {
  children: React.ReactNode; accent?: string; delay?: number;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hov, setHov]   = useState(false);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width  - .5) * 18;
    const my = ((e.clientY - r.top)  / r.height - .5) * -14;
    setTilt({ x: my, y: mx });
  };
  return (
    <div
      style={{
        ...sec(delay),
        flex: 1, minWidth: 0,
        background:  hov ? `${accent}0e` : 'rgba(255,255,255,.025)',
        border:      `1px solid ${hov ? accent + '45' : 'rgba(255,255,255,.07)'}`,
        borderRadius: 14,
        padding: '28px 26px',
        cursor: 'default',
        transformStyle: 'preserve-3d',
        transform: hov
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: 'transform .18s ease, border-color .2s, background .2s',
        boxShadow: hov ? `0 20px 60px ${accent}18` : 'none',
      }}
      onMouseMove={onMove}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setTilt({ x: 0, y: 0 }); }}
    >
      {children}
    </div>
  );
}

/* ─── Language tabs ──────────────────────────────────────────────────────────── */
const CODE_SAMPLES: Record<string, string[]> = {
  Java: [
    'public class Order {',
    '  private Long id;',
    '  private Customer customer;',
    '  private List<OrderItem> items = new ArrayList<>();',
    '',
    '  public void addItem(OrderItem item) {',
    '    this.items.add(item);',
    '  }',
    '  public Double getTotal() {',
    '    return items.stream().mapToDouble(OrderItem::getPrice).sum();',
    '  }',
    '}',
  ],
  Kotlin: [
    'data class Order(',
    '  val id: Long,',
    '  val customer: Customer,',
    '  val items: MutableList<OrderItem> = mutableListOf()',
    ') {',
    '  fun addItem(item: OrderItem) = items.add(item)',
    '  fun getTotal() = items.sumOf { it.price }',
    '}',
  ],
  Python: [
    'class Order:',
    '    def __init__(self, id: int, customer):',
    '        self.id = id',
    '        self.customer = customer',
    '        self.items: list = []',
    '',
    '    def add_item(self, item) -> None:',
    '        self.items.append(item)',
    '',
    '    def get_total(self) -> float:',
    '        return sum(i.price for i in self.items)',
  ],
  'Oracle DDL': [
    'CREATE TABLE orders (',
    '  id         NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
    '  customer_id NUMBER      NOT NULL,',
    '  created_at  TIMESTAMP   DEFAULT SYSDATE,',
    '  status      VARCHAR2(32) DEFAULT \'PENDING\',',
    '  CONSTRAINT fk_cust FOREIGN KEY (customer_id)',
    '    REFERENCES customers(id)',
    ');',
  ],
};
const LANG_COLORS: Record<string, string> = {
  Java: '#f97316', Kotlin: '#a78bfa', Python: '#4ade80', 'Oracle DDL': '#60a5fa',
};
function CodeBlock() {
  const langs = Object.keys(CODE_SAMPLES);
  const [active, setActive] = useState('Java');
  const lines = CODE_SAMPLES[active];
  return (
    <div style={{ background: '#020810', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#040b16', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 12px' }}>
        {langs.map(l => (
          <button key={l} onClick={() => setActive(l)} style={{
            background: 'none', border: 'none',
            borderBottom: `2px solid ${active === l ? LANG_COLORS[l] : 'transparent'}`,
            color: active === l ? LANG_COLORS[l] : '#334155',
            padding: '9px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
          }}>{l}</button>
        ))}
      </div>
      {/* Code */}
      <div style={{ padding: '16px 20px', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, lineHeight: 1.75, minHeight: 200, overflowX: 'auto' }}>
        {lines.map((line, i) => (
          <div key={`${active}-${i}`} style={{
            whiteSpace: 'pre',
            color: line.trim().startsWith('//') ? '#334155'
                 : /\b(public|private|class|def|val|data|fun|return|import|CREATE|TABLE|NOT NULL|PRIMARY KEY|FOREIGN KEY|REFERENCES|DEFAULT|GENERATED|ALWAYS|AS|IDENTITY|CONSTRAINT|INSERT|VALUES)\b/.test(line) ? '#c084fc'
                 : line.includes(':') ? '#60a5fa'
                 : '#94a3b8',
          }}>{line || ' '}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Collab visual ──────────────────────────────────────────────────────────── */
const PEERS = [
  { name: 'Alex',  color: '#f97316', x: '12%', y: '22%', delay: 0 },
  { name: 'Sam',   color: '#4ade80', x: '62%', y: '15%', delay: 200 },
  { name: 'Jamie', color: '#c084fc', x: '42%', y: '58%', delay: 400 },
  { name: 'Dana',  color: '#60a5fa', x: '76%', y: '50%', delay: 600 },
];
function CollabVisual() {
  return (
    <div style={{ position: 'relative', height: 200, background: '#04080f', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
      {/* dot grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      {/* Floating avatars */}
      {PEERS.map(p => (
        <div key={p.name} style={{ position: 'absolute', left: p.x, top: p.y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: `avatarPop .5s ease ${p.delay}ms both` }}>
          <svg width="14" height="18" viewBox="0 0 14 18" style={{ filter: `drop-shadow(0 0 4px ${p.color})` }}>
            <path d="M0 0 L0 14 L4 10 L7 16 L9 15 L6 9 L11 9 Z" fill={p.color} />
          </svg>
          <div style={{ background: p.color, borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 800, color: '#000', whiteSpace: 'nowrap' }}>{p.name}</div>
          <div style={{ position: 'absolute', top: -4, left: -4, width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${p.color}`, animation: `pingRing 2s ease-in-out ${p.delay}ms infinite` }} />
        </div>
      ))}
      {/* share link pill */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(249,115,22,.12)', border: '1px solid rgba(249,115,22,.3)', borderRadius: 100, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pingRing 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: '"JetBrains Mono",monospace' }}>app.uml2java.dev/?room=a3f9…</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316', cursor: 'pointer' }}>Copy</span>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
interface Props { onClose: () => void; onSignIn?: () => void; onStartTutorial?: () => void; }

export default function LandingModal({ onClose, onSignIn, onStartTutorial }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const orangeBtn: CSSProperties = {
    background: '#f97316', border: 'none', borderRadius: 100,
    color: '#fff', padding: '12px 28px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'all .2s',
    boxShadow: '0 0 28px rgba(249,115,22,.45)',
    animation: 'orbPulse 2.8s ease-in-out 1.2s infinite',
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* ── Full-screen container ─────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        overflowY: 'auto', background: '#000610',
        fontFamily: '"IBM Plex Sans",system-ui,sans-serif',
      }}>

        {/* ── BLACK HOLE BACKGROUND ─────────────────────────────────── */}
        <BlackHoleBg />

        {/* ── CONTENT ──────────────────────────────────────────────── */}
        <div style={{ position:'relative', zIndex:1 }}>

          {/* ── NAVBAR ─────────────────────────────────────────────── */}
          <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 40px', background:'rgba(4,6,13,.8)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(255,255,255,.05)', animation:'navIn .5s ease both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff' }}>U</div>
              <span style={{ fontSize:15, fontWeight:800, color:'#f1f5f9', letterSpacing:-.3 }}>UML→Java</span>
            </div>
            <div style={{ display:'flex', gap:28 }}>
              {['Diagrams','Code','Collaboration'].map(l => (
                <span key={l} style={{ fontSize:14, color:'#475569', cursor:'pointer', transition:'color .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.color='#cbd5e1'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='#475569'}}
                >{l}</span>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={onSignIn ?? onClose} style={{ background:'transparent', border:'1px solid rgba(255,255,255,.14)', borderRadius:100, color:'#cbd5e1', padding:'8px 20px', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.3)';e.currentTarget.style.color='#f1f5f9'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.14)';e.currentTarget.style.color='#cbd5e1'}}
              >Sign in</button>
              <button onClick={onClose} style={{ background:'#f97316', border:'none', borderRadius:100, color:'#fff', padding:'8px 22px', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#ea580c';e.currentTarget.style.transform='scale(1.04)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='#f97316';e.currentTarget.style.transform='none'}}
              >Get started</button>
              <button onClick={onClose} aria-label="Close" style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:7, color:'#475569', cursor:'pointer', padding:'5px 6px', display:'flex', alignItems:'center', transition:'all .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.color='#f1f5f9'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#475569'}}
              ><XIcon size={10}/></button>
            </div>
          </nav>

          {/* ── HERO ───────────────────────────────────────────────── */}
          <section style={{ minHeight:'calc(100vh - 61px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'60px 24px 0', position:'relative' }}>


            {/* pill */}
            <div style={{ ...u(80,.5), display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.055)', border:'1px solid rgba(255,255,255,.1)', borderRadius:100, padding:'5px 14px 5px 6px', marginBottom:34, cursor:'pointer' }}>
              <span style={{ background:'#f97316', borderRadius:100, padding:'2px 10px', fontSize:11, fontWeight:800, color:'#fff' }}>NEW</span>
              <span style={{ fontSize:13, color:'#94a3b8' }}>Live collaboration is here · Try it now</span>
              <span style={{ fontSize:13, color:'#f97316' }}>→</span>
            </div>

            {/* headline */}
            <h1 style={{ ...u(160), margin:'0 0 22px', fontSize:'clamp(38px,6.5vw,76px)', fontWeight:900, color:'#f8fafc', lineHeight:1.06, letterSpacing:-2.5, maxWidth:820 }}>
              Design Visually.<br/>
              <span style={{ background:'linear-gradient(90deg,#f97316,#fbbf24,#f97316)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'shimmerText 3.5s linear infinite' }}>Generate Instantly.</span>
            </h1>

            {/* sub */}
            <p style={{ ...u(280), margin:'0 0 38px', fontSize:'clamp(15px,1.8vw,18px)', color:'#64748b', lineHeight:1.65, maxWidth:520 }}>
              Turn UML diagrams into production-ready Java, Kotlin, Python or Oracle DDL in seconds — and build together with real-time collaboration.
            </p>

            {/* CTAs */}
            <div style={{ ...u(380), display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:20 }}>
              {/* Primary: generate code (start building) */}
              <button onClick={onClose} style={orangeBtn}
                onMouseEnter={e=>{e.currentTarget.style.background='#ea580c';e.currentTarget.style.boxShadow='0 0 48px rgba(249,115,22,.75)';e.currentTarget.style.transform='translateY(-3px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='#f97316';e.currentTarget.style.boxShadow='0 0 28px rgba(249,115,22,.45)';e.currentTarget.style.transform='none'}}
              >Generate Code →</button>
              {/* Sign in — right next to the generate button */}
              <button onClick={onSignIn ?? onClose} style={{
                background:'transparent',
                border:'1px solid rgba(255,255,255,.18)',
                borderRadius:100, color:'#cbd5e1',
                padding:'12px 28px', fontSize:15, fontWeight:600,
                cursor:'pointer', transition:'all .2s',
                display:'flex', alignItems:'center', gap:8,
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.35)';e.currentTarget.style.color='#f1f5f9';e.currentTarget.style.background='rgba(255,255,255,.06)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.18)';e.currentTarget.style.color='#cbd5e1';e.currentTarget.style.background='transparent'}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Sign In
              </button>
              {/* Take a Tour */}
              {onStartTutorial && (
                <button onClick={onStartTutorial} style={{
                  background:'transparent',
                  border:'1px solid rgba(249,115,22,.3)',
                  borderRadius:100, color:'#f97316',
                  padding:'12px 28px', fontSize:15, fontWeight:600,
                  cursor:'pointer', transition:'all .2s',
                  display:'flex', alignItems:'center', gap:9,
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(249,115,22,.6)';e.currentTarget.style.background='rgba(249,115,22,.08)';e.currentTarget.style.boxShadow='0 0 20px rgba(249,115,22,.2)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(249,115,22,.3)';e.currentTarget.style.background='transparent';e.currentTarget.style.boxShadow='none'}}
                >
                  {/* play/tour icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10,8 16,12 10,16" fill="#f97316" stroke="none"/>
                  </svg>
                  Take a Tour
                </button>
              )}
            </div>
            {/* sub-text hint */}
            <p style={{ ...u(460), margin:'0 0 40px', fontSize:12, color:'#334155' }}>
              No account needed to generate · <span style={{ color:'#475569', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }} onClick={onSignIn ?? onClose}>Sign in</span> to save &amp; collaborate
            </p>

            {/* trusted by */}
            <div style={{ ...u(520), marginBottom:60 }}>
              <p style={{ fontSize:11, color:'#1e293b', margin:'0 0 14px', letterSpacing:.8 }}>TRUSTED BY DEVELOPERS AT</p>
              <div style={{ display:'flex', gap:32, justifyContent:'center', flexWrap:'wrap', alignItems:'center' }}>
                {['GitHub','GitLab','Atlassian','JetBrains','Oracle'].map(n=>(
                  <span key={n} style={{ fontSize:14, fontWeight:800, color:'#1e293b', letterSpacing:-.3 }}>{n}</span>
                ))}
              </div>
            </div>

            {/* ── 3-D FLOATING MOCKUP ─────────────────────────────── */}
            <div style={{ ...u(580,.9), width:'100%', maxWidth:960, animation:'float3d 7s ease-in-out infinite', transformOrigin:'center bottom' }}>
              {/* glow reflection */}
              <div style={{ height:40, background:'radial-gradient(ellipse at 50% 0%,rgba(249,115,22,.25) 0%,transparent 75%)', marginBottom:-2 }}/>
              <div style={{ background:'rgba(5,10,20,.96)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'16px 16px 0 0', overflow:'hidden', boxShadow:'0 -20px 80px rgba(249,115,22,.13), 0 0 0 1px rgba(255,255,255,.04)' }}>
                {/* toolbar */}
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 16px', background:'rgba(3,6,14,.96)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }}/>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#eab308' }}/>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }}/>
                  <div style={{ flex:1, display:'flex', gap:4, marginLeft:14 }}>
                    {['Class','Flowchart','ER','Sequence','Activity'].map((t,i)=>(
                      <span key={t} style={{ fontSize:11, padding:'3px 10px', borderRadius:5, background:i===0?'rgba(249,115,22,.15)':'transparent', color:i===0?'#f97316':'#1e293b', border:`1px solid ${i===0?'rgba(249,115,22,.3)':'transparent'}` }}>{t}</span>
                    ))}
                  </div>
                  <button style={{ background:'#f97316', border:'none', borderRadius:6, color:'#fff', padding:'5px 14px', fontSize:11, fontWeight:700, cursor:'default' }}>▶ Generate</button>
                </div>
                {/* canvas + code */}
                <div style={{ display:'flex', height:220 }}>
                  {/* palette */}
                  <div style={{ width:52, background:'rgba(3,6,14,.9)', borderRight:'1px solid rgba(255,255,255,.05)', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:12, gap:10 }}>
                    {['C','I','A','E'].map((l,i)=>(
                      <div key={i} style={{ width:32, height:28, borderRadius:6, border:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.03)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#334155', fontWeight:700 }}>{l}</div>
                    ))}
                  </div>
                  {/* canvas */}
                  <div style={{ flex:1, position:'relative', background:'#04080f' }}>
                    <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize:'20px 20px' }}/>
                    {/* nodes */}
                    {[
                      { label:'User',    color:'#f97316', top:22,  left:60,  fields:['– id: Long','– name: String','– email: String'] },
                      { label:'Order',   color:'#818cf8', top:22,  left:230, fields:['– id: Long','– total: Double','– status: String'] },
                      { label:'Product', color:'#4ade80', top:138, left:144, fields:['– id: Long','– price: Double'] },
                    ].map(n=>(
                      <div key={n.label} style={{ position:'absolute', top:n.top, left:n.left, background:'#080f1e', border:`1px solid ${n.color}55`, borderRadius:8, width:118, overflow:'hidden', boxShadow:`0 0 16px ${n.color}18` }}>
                        <div style={{ background:`${n.color}14`, padding:'5px 10px', fontSize:10, fontWeight:800, color:n.color, borderBottom:`1px solid ${n.color}22` }}>«class» {n.label}</div>
                        <div style={{ padding:'6px 10px' }}>{n.fields.map(f=><div key={f} style={{ fontSize:9, color:'#475569', marginBottom:2 }}>{f}</div>)}</div>
                      </div>
                    ))}
                    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                      <line x1="178" y1="68" x2="230" y2="68" stroke="rgba(129,140,248,.4)" strokeWidth="1.5" strokeDasharray="5,3"/>
                      <line x1="202" y1="108" x2="202" y2="138" stroke="rgba(74,222,128,.35)" strokeWidth="1.5" strokeDasharray="5,3"/>
                    </svg>
                  </div>
                  {/* code */}
                  <div style={{ width:270, background:'#02050c', borderLeft:'1px solid rgba(255,255,255,.06)', padding:'14px 18px', fontFamily:'"JetBrains Mono",monospace', fontSize:10.5, lineHeight:1.75, overflow:'hidden' }}>
                    <div><span style={{color:'#c084fc'}}>public class </span><span style={{color:'#60a5fa'}}>User</span><span style={{color:'#94a3b8'}}>{' {'}</span></div>
                    {[['private','Long','id'],['private','String','name'],['private','String','email']].map(([kw,ty,nm])=>(
                      <div key={nm} style={{paddingLeft:14}}><span style={{color:'#c084fc'}}>{kw} </span><span style={{color:'#60a5fa'}}>{ty} </span><span style={{color:'#e2e8f0'}}>{nm};</span></div>
                    ))}
                    <div>&nbsp;</div>
                    <div style={{paddingLeft:14}}><span style={{color:'#c084fc'}}>public </span><span style={{color:'#60a5fa'}}>Long </span><span style={{color:'#fbbf24'}}>getId</span><span style={{color:'#94a3b8'}}>{'() {'}</span></div>
                    <div style={{paddingLeft:28}}><span style={{color:'#c084fc'}}>return </span><span style={{color:'#e2e8f0'}}>id;</span></div>
                    <div style={{paddingLeft:14,color:'#94a3b8'}}>{'}'}</div>
                    <div>&nbsp;</div>
                    <div style={{paddingLeft:14}}><span style={{color:'#c084fc'}}>public void </span><span style={{color:'#fbbf24'}}>setName</span><span style={{color:'#94a3b8'}}>{'(String n) {'}</span></div>
                    <div style={{paddingLeft:28}}><span style={{color:'#c084fc'}}>this</span><span style={{color:'#e2e8f0'}}>.name = n;</span></div>
                    <div style={{paddingLeft:14,color:'#94a3b8'}}>{'}'}</div>
                    <div style={{color:'#94a3b8'}}>{'}'}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              FEATURES SECTION
          ══════════════════════════════════════════════════════════ */}
          <section style={{ maxWidth:1040, margin:'0 auto', padding:'100px 32px 80px' }}>

            {/* section header */}
            <div style={{ ...sec(0), textAlign:'center', marginBottom:64 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.2)', borderRadius:100, padding:'4px 16px', marginBottom:20 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#f97316' }}/>
                <span style={{ fontSize:11, fontWeight:700, color:'#f97316', letterSpacing:.8 }}>EVERYTHING YOU NEED</span>
              </div>
              <h2 style={{ margin:'0 0 16px', fontSize:'clamp(26px,4vw,42px)', fontWeight:900, color:'#f1f5f9', letterSpacing:-1.5, lineHeight:1.1 }}>
                Diagrams. Code. Collaboration.<br/>
                <span style={{ color:'#475569' }}>All in one place.</span>
              </h2>
              <p style={{ fontSize:16, color:'#475569', maxWidth:480, margin:'0 auto', lineHeight:1.65 }}>
                From first sketch to production-ready output — design on the canvas, generate with one click, and collaborate in real time.
              </p>
            </div>

            {/* ── FEATURE CARDS ROW ───────────────────────────────── */}
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:80 }}>

              {/* Card 1: Diagrams */}
              <Card3D accent="#f97316" delay={100}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'rgba(249,115,22,.12)', border:'1px solid rgba(249,115,22,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="4" width="12" height="8" rx="2"/><rect x="23" y="4" width="12" height="8" rx="2"/><rect x="14" y="28" width="12" height="8" rx="2"/><line x1="11" y1="12" x2="11" y2="24"/><line x1="29" y1="12" x2="29" y2="24"/><line x1="11" y1="24" x2="20" y2="28"/><line x1="29" y1="24" x2="20" y2="28"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#f1f5f9' }}>Visual Diagrams</div>
                    <div style={{ fontSize:10, color:'#f97316', fontWeight:700, letterSpacing:.5 }}>5 DIAGRAM TYPES</div>
                  </div>
                </div>
                <p style={{ fontSize:13, color:'#475569', lineHeight:1.65, margin:'0 0 18px' }}>
                  Build <strong style={{color:'#94a3b8'}}>Class</strong>, <strong style={{color:'#94a3b8'}}>Flowchart</strong>, <strong style={{color:'#94a3b8'}}>ER</strong>, <strong style={{color:'#94a3b8'}}>Sequence</strong>, and <strong style={{color:'#94a3b8'}}>Activity</strong> diagrams on a drag-and-drop canvas. Add fields, methods, and edge relationships visually — no text syntax to memorise.
                </p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Class','Flowchart','ER','Sequence','Activity'].map(t=>(
                    <span key={t} style={{ fontSize:10, padding:'3px 9px', borderRadius:5, background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.2)', color:'#f97316', fontWeight:700 }}>{t}</span>
                  ))}
                </div>
              </Card3D>

              {/* Card 2: Code */}
              <Card3D accent="#4ade80" delay={200}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#f1f5f9' }}>Code Generation</div>
                    <div style={{ fontSize:10, color:'#4ade80', fontWeight:700, letterSpacing:.5 }}>4 LANGUAGES</div>
                  </div>
                </div>
                <p style={{ fontSize:13, color:'#475569', lineHeight:1.65, margin:'0 0 18px' }}>
                  Click <strong style={{color:'#94a3b8'}}>Generate</strong> and get clean, production-quality output instantly. Supports <strong style={{color:'#94a3b8'}}>Java</strong>, <strong style={{color:'#94a3b8'}}>Kotlin</strong>, <strong style={{color:'#94a3b8'}}>Python</strong> (OOP), and <strong style={{color:'#94a3b8'}}>Oracle DDL</strong> — all properly formatted with getters, setters, and constraints.
                </p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Java','Kotlin','Python','Oracle DDL'].map((t,i)=>{
                    const c = ['#f97316','#a78bfa','#4ade80','#60a5fa'][i];
                    return <span key={t} style={{ fontSize:10, padding:'3px 9px', borderRadius:5, background:`${c}10`, border:`1px solid ${c}35`, color:c, fontWeight:700 }}>{t}</span>;
                  })}
                </div>
              </Card3D>

              {/* Card 3: Collaboration */}
              <Card3D accent="#818cf8" delay={300}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'rgba(129,140,248,.1)', border:'1px solid rgba(129,140,248,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#f1f5f9' }}>Live Collaboration</div>
                    <div style={{ fontSize:10, color:'#818cf8', fontWeight:700, letterSpacing:.5 }}>REAL-TIME SYNC</div>
                  </div>
                </div>
                <p style={{ fontSize:13, color:'#475569', lineHeight:1.65, margin:'0 0 18px' }}>
                  Share a link and teammates join instantly. See <strong style={{color:'#94a3b8'}}>live cursors</strong>, watch diagram changes sync in real time, and never lose work — all powered by <strong style={{color:'#94a3b8'}}>Supabase Realtime</strong>. No account required to collaborate.
                </p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Live cursors','Auto-sync','Share link','No signup'].map(t=>(
                    <span key={t} style={{ fontSize:10, padding:'3px 9px', borderRadius:5, background:'rgba(129,140,248,.08)', border:'1px solid rgba(129,140,248,.2)', color:'#818cf8', fontWeight:700 }}>{t}</span>
                  ))}
                </div>
              </Card3D>
            </div>

            {/* ── DEEP DIVES ──────────────────────────────────────── */}

            {/* --- Diagrams deep dive --- */}
            <div style={{ ...sec(0), display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center', marginBottom:100 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#f97316', letterSpacing:1, marginBottom:12 }}>DIAGRAMS</div>
                <h3 style={{ margin:'0 0 16px', fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#f1f5f9', lineHeight:1.2, letterSpacing:-.8 }}>
                  Every diagram type your project needs
                </h3>
                <p style={{ fontSize:14, color:'#475569', lineHeight:1.7, margin:'0 0 24px' }}>
                  Switch between diagram modes with one click. Each type has its own smart node palette — class fields, decision branches, entity tables, message lifelines, and activity flows.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { icon:'◻', label:'Class Diagram',    desc:'OOP classes with fields, methods, inheritance and associations' },
                    { icon:'◇', label:'Flowchart',         desc:'Decision trees, loops, and process flows → Java control flow' },
                    { icon:'⬡', label:'ER Diagram',        desc:'Entities and relationships → CREATE TABLE Oracle DDL' },
                    { icon:'↕', label:'Sequence Diagram',  desc:'Object interactions and message sequences across lifelines' },
                    { icon:'◎', label:'Activity Diagram',  desc:'Parallel flows, forks, joins, and action chains' },
                  ].map(item => (
                    <div key={item.label} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ fontSize:16, marginTop:1, opacity:.6 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:2 }}>{item.label}</div>
                        <div style={{ fontSize:11, color:'#475569', lineHeight:1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                {/* 3D mockup panel */}
                <div style={{ perspective:1000 }}>
                  <div style={{ transform:'perspective(1000px) rotateY(-8deg) rotateX(4deg)', transition:'transform .3s', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,.07)', background:'#04080f', boxShadow:'20px 20px 60px rgba(0,0,0,.6), -4px -4px 30px rgba(249,115,22,.06)' }}>
                    <div style={{ display:'flex', gap:5, padding:'10px 14px', background:'rgba(3,6,14,.9)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                      <div style={{ width:9, height:9, borderRadius:'50%', background:'#ef4444' }}/><div style={{ width:9, height:9, borderRadius:'50%', background:'#eab308' }}/><div style={{ width:9, height:9, borderRadius:'50%', background:'#22c55e' }}/>
                    </div>
                    {/* diagram tabs */}
                    <div style={{ display:'flex', background:'rgba(3,6,14,.7)', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      {[{t:'Class',c:'#f97316'},{t:'Flowchart',c:'#4ade80'},{t:'ER',c:'#818cf8'},{t:'Sequence',c:'#60a5fa'},{t:'Activity',c:'#fbbf24'}].map(({t,c},i)=>(
                        <div key={t} style={{ fontSize:10, padding:'7px 12px', color:i===0?c:'#1e293b', borderBottom:`2px solid ${i===0?c:'transparent'}`, fontWeight:700 }}>{t}</div>
                      ))}
                    </div>
                    {/* mini canvas */}
                    <div style={{ height:180, background:'#04080f', position:'relative' }}>
                      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize:'18px 18px' }}/>
                      <div style={{ position:'absolute', top:20, left:20, background:'#080f1e', border:'1px solid rgba(249,115,22,.45)', borderRadius:7, width:100 }}>
                        <div style={{ background:'rgba(249,115,22,.12)', padding:'4px 9px', fontSize:9, fontWeight:800, color:'#f97316', borderBottom:'1px solid rgba(249,115,22,.2)' }}>«class» Vehicle</div>
                        <div style={{ padding:'5px 9px' }}>{['– make: String','– model: String','+ drive(): void'].map(f=><div key={f} style={{ fontSize:8, color:'#334155', marginBottom:1 }}>{f}</div>)}</div>
                      </div>
                      <div style={{ position:'absolute', top:20, left:150, background:'#080f1e', border:'1px solid rgba(129,140,248,.45)', borderRadius:7, width:100 }}>
                        <div style={{ background:'rgba(129,140,248,.12)', padding:'4px 9px', fontSize:9, fontWeight:800, color:'#818cf8', borderBottom:'1px solid rgba(129,140,248,.2)' }}>«class» Car</div>
                        <div style={{ padding:'5px 9px' }}>{['– doors: Int','– turbo: Boolean','+ honk(): void'].map(f=><div key={f} style={{ fontSize:8, color:'#334155', marginBottom:1 }}>{f}</div>)}</div>
                      </div>
                      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                        <line x1="120" y1="60" x2="150" y2="60" stroke="rgba(129,140,248,.5)" strokeWidth="1.5" strokeDasharray="4,3"/>
                        <polygon points="150,57 156,60 150,63" fill="rgba(129,140,248,.5)"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Code deep dive --- */}
            <div style={{ ...sec(0), display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start', marginBottom:100 }}>
              <div>
                <CodeBlock />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#4ade80', letterSpacing:1, marginBottom:12 }}>CODE GENERATION</div>
                <h3 style={{ margin:'0 0 16px', fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#f1f5f9', lineHeight:1.2, letterSpacing:-.8 }}>
                  One diagram, four languages
                </h3>
                <p style={{ fontSize:14, color:'#475569', lineHeight:1.7, margin:'0 0 24px' }}>
                  Click <strong style={{color:'#4ade80'}}>Generate</strong> once and instantly switch between Java, Kotlin, Python, and Oracle DDL output — the same diagram, perfectly formatted for each target.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { lang:'Java',       color:'#f97316', note:'Full getters/setters, constructors, OOP hierarchy' },
                    { lang:'Kotlin',     color:'#a78bfa', note:'Data classes, val/var, idiomatic null safety' },
                    { lang:'Python',     color:'#4ade80', note:'Type-hinted classes, __init__, properties' },
                    { lang:'Oracle DDL', color:'#60a5fa', note:'CREATE TABLE, PK/FK constraints, sequences' },
                  ].map(({lang,color,note})=>(
                    <div key={lang} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 14px', borderRadius:8, background:`${color}08`, border:`1px solid ${color}20` }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:color, marginTop:4, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color, marginBottom:2 }}>{lang}</div>
                        <div style={{ fontSize:11, color:'#475569', lineHeight:1.5 }}>{note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- Collaboration deep dive --- */}
            <div style={{ ...sec(0), display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center', marginBottom:80 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#818cf8', letterSpacing:1, marginBottom:12 }}>COLLABORATION</div>
                <h3 style={{ margin:'0 0 16px', fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#f1f5f9', lineHeight:1.2, letterSpacing:-.8 }}>
                  Share a link.<br/>Build together, live.
                </h3>
                <p style={{ fontSize:14, color:'#475569', lineHeight:1.7, margin:'0 0 24px' }}>
                  Hit <strong style={{color:'#818cf8'}}>Share</strong> in the toolbar, send the URL, and collaborators join your canvas instantly. All node, edge, and diagram changes broadcast in real time — cursors, names, and all.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { label:'Instant join',    desc:'Anyone with the link enters the room immediately — no login required' },
                    { label:'Cursor presence', desc:'See each collaborator\'s coloured cursor and display name live on canvas' },
                    { label:'Full state sync',  desc:'Nodes, edges, and diagram type all sync within 400 ms of any change' },
                    { label:'Room URLs',        desc:'?room= parameter in the URL — share via Slack, email, or anywhere' },
                  ].map(({label,desc})=>(
                    <div key={label} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 14px', borderRadius:8, background:'rgba(129,140,248,.04)', border:'1px solid rgba(129,140,248,.12)' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#818cf8', marginTop:4, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#818cf8', marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:11, color:'#475569', lineHeight:1.5 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <CollabVisual />
              </div>
            </div>

            {/* ── FINAL CTA ───────────────────────────────────────── */}
            <div style={{ textAlign:'center', padding:'60px 0 20px' }}>
              <div style={{ ...sec(0), position:'relative', display:'inline-block' }}>
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(249,115,22,.15) 0%,transparent 70%)', pointerEvents:'none' }}/>
                <h2 style={{ margin:'0 0 14px', fontSize:'clamp(24px,4vw,40px)', fontWeight:900, color:'#f1f5f9', letterSpacing:-1.5 }}>
                  Ready to build?
                </h2>
                <p style={{ fontSize:15, color:'#475569', margin:'0 0 32px' }}>
                  No account needed. Open the canvas and start designing.
                </p>
                <button onClick={onClose} style={{ ...orangeBtn, fontSize:16, padding:'14px 40px' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#ea580c';e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 0 56px rgba(249,115,22,.75)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f97316';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 28px rgba(249,115,22,.45)'}}
                >
                  Open the Canvas →
                </button>
                <p style={{ fontSize:11, color:'#1e293b', marginTop:16 }}>
                  No account needed · Runs entirely in your browser · Free forever
                </p>
              </div>
            </div>

          </section>
        </div>
      </div>
    </>
  );
}
