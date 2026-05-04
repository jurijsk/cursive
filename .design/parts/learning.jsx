// learning.jsx — letter card, flashcard, progress, lesson tile, tracing, listening

// ── Letter Card (the centerpiece) ─────────────────────────────
const LetterCard = () => (
  <DCArtboard id="letter-card" label="11 · Letter card" width={520} height={680}>
    <div className="ab" style={{ position:'absolute', inset:0, background:'var(--page_bg)', padding: 28 }}>
      <div style={{
        background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)',
        borderRadius:'var(--r_4)', boxShadow:'var(--e_2)', padding: 28, height:'calc(100% - 56px)',
        display:'flex', flexDirection:'column'
      }}>
        <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
          <Badge tone="sage" dot>Letter 5 of 28</Badge>
          <div className="mono" style={{ color:'var(--secondary_text)' }}>jīm · ج</div>
        </div>

        {/* Hero glyph */}
        <div style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <div style={{
            position:'absolute', inset: 24,
            backgroundImage:'repeating-linear-gradient(90deg, rgba(91,132,102,.08) 0 1px, transparent 1px 64px)',
            opacity:.6
          }}/>
          <div className="ar" style={{ fontSize: 220, lineHeight: 1, color:'var(--primary_text)', fontWeight: 400 }}>ج</div>
        </div>

        {/* Phonetic line */}
        <div style={{ borderTop:'1px solid var(--sunken_bg)', paddingTop: 14, marginTop: 8 }}>
          <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>Sounds like</div>
          <div style={{ fontFamily:'var(--f_display)', fontSize: 26, color:'var(--primary_text)', letterSpacing:'-0.01em' }}>j <span style={{ color:'var(--tertiary_text)' }}>as in</span> jam</div>
        </div>

        {/* Forms */}
        <div style={{ marginTop: 18, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10 }}>
          {[['isolated','ج'],['initial','جـ'],['medial','ـجـ'],['final','ـج']].map(([n,g],i)=>(
            <div key={i} style={{
              background: i===0 ? 'var(--accent_primary_quiet)' : 'var(--page_bg)',
              border:'1px solid ' + (i===0 ? 'var(--accent_primary_quiet_border)' : 'var(--subtle_stroke)'),
              borderRadius:'var(--r_3)', padding:'12px 8px', textAlign:'center',
            }}>
              <div className="ar" style={{ fontSize: 32, color: i===0 ? 'var(--accent_primary_hi)' : 'var(--primary_text)', lineHeight: 1 }}>{g}</div>
              <div className="mono" style={{ color:'var(--secondary_text)', marginTop: 8 }}>{n}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap: 10, marginTop: 18 }}>
          <Btn kind="secondary" size="md" leading={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ marginRight: 6 }}><path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2"/></svg>}>Hear it</Btn>
          <Btn size="md" trailing={<span style={{ marginLeft: 6 }}>→</span>}>Practice</Btn>
        </div>
      </div>
    </div>
  </DCArtboard>
);

// ── Flashcard (front + back) ──────────────────────────────────
const Flashcard = () => (
  <DCArtboard id="flashcard" label="12 · Flashcard" width={1080} height={520}>
    <Section kicker="Learning" title="Flashcards">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24, marginTop: 6 }}>
        {/* Front */}
        <div style={{
          background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)',
          borderRadius:'var(--r_4)', boxShadow:'var(--e_2)', padding: 28, minHeight: 320,
          display:'flex', flexDirection:'column', justifyContent:'space-between'
        }}>
          <div className="row" style={{ justifyContent:'space-between' }}>
            <Badge>Front</Badge>
            <span className="mono" style={{ color:'var(--secondary_text)' }}>card 4 / 12</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 12 }}>
            <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>Read aloud</div>
            <div className="ar" style={{ fontSize: 96, color:'var(--primary_text)', lineHeight: 1 }}>كَتَبَ</div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap: 10 }}>
            <Btn kind="ghost" size="sm">Skip</Btn>
            <Btn kind="secondary" size="sm">Reveal</Btn>
          </div>
        </div>

        {/* Back */}
        <div style={{
          background:'var(--primary_text)', color:'var(--surface_bg)',
          borderRadius:'var(--r_4)', boxShadow:'var(--e_3)', padding: 28, minHeight: 320,
          display:'flex', flexDirection:'column', justifyContent:'space-between'
        }}>
          <div className="row" style={{ justifyContent:'space-between' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 6, fontSize: 11, fontWeight: 500, padding:'4px 10px', borderRadius:'var(--r_pill)', background:'rgba(245,231,200,.15)', color:'var(--accent_honor_quiet)' }}>Back</span>
            <span className="mono" style={{ color:'rgba(245,231,200,.6)' }}>kataba · he wrote</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
            <div className="ar" style={{ fontSize: 64, color:'var(--surface_bg)', lineHeight: 1 }}>كَتَبَ</div>
            <div style={{ fontFamily:'var(--f_display)', fontSize: 30, color:'var(--accent_honor_quiet)' }}>kataba</div>
            <div style={{ fontSize: 14, color:'rgba(245,231,200,.7)' }}>“he wrote”</div>
          </div>
          <div style={{ display:'flex', gap: 8, justifyContent:'space-between' }}>
            <RecallBtn label="Again" sub="<1m" tone="error" />
            <RecallBtn label="Hard" sub="6m" tone="warn" />
            <RecallBtn label="Good" sub="1d" tone="sage" />
            <RecallBtn label="Easy" sub="4d" tone="saffron" />
          </div>
        </div>
      </div>
    </Section>
  </DCArtboard>
);

const RecallBtn = ({ label, sub, tone }) => {
  const colors = {
    error: '#e8a39a', warn: '#e6c794', sage: '#a4c5ad', saffron: '#e8cf94',
  }[tone];
  return (
    <button style={{
      flex: 1, padding:'10px 0', borderRadius:'var(--r_2)', cursor:'pointer',
      background:'rgba(245,231,200,.08)', border:'1px solid rgba(245,231,200,.18)',
      color: colors, fontFamily:'var(--f_ui)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 10, color:'rgba(245,231,200,.6)', marginTop: 2 }}>{sub}</div>
    </button>
  );
};

// ── Progress ──────────────────────────────────────────────────
const ProgressBits = () => (
  <DCArtboard id="progress" label="13 · Progress" width={680} height={620}>
    <Section kicker="Learning" title="Showing growth, quietly">
      {/* Linear */}
      <div style={{ marginBottom: 20 }}>
        <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 8 }}>Lesson bar</div>
        <div style={{ height: 6, background:'var(--sunken_bg)', borderRadius: 999, overflow:'hidden' }}>
          <div style={{ width:'62%', height:'100%', background:'var(--accent_primary)', borderRadius: 999 }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color:'var(--secondary_text)' }}>5 of 8 letters</div>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: 24 }}>
        <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 10 }}>Stepper (lesson chunks)</div>
        <div style={{ display:'flex', gap: 6 }}>
          {[1,1,1,1,0,0,0,0].map((on,i)=>(
            <div key={i} style={{ flex:1, height: 4, borderRadius: 4, background: on ? 'var(--accent_primary)' : 'var(--sunken_bg)' }} />
          ))}
        </div>
      </div>

      {/* Mastery ring */}
      <div style={{ display:'flex', gap: 28, alignItems:'center', marginBottom: 24 }}>
        <div className="mono" style={{ color:'var(--secondary_text)', width: 110 }}>Mastery ring</div>
        <Ring pct={72} />
        <Ring pct={40} />
        <Ring pct={12} muted />
        <div style={{ fontSize: 12, color:'var(--secondary_text)', maxWidth: 200 }}>One ring per letter family. Fills as you recall correctly across forms.</div>
      </div>

      {/* Streak */}
      <div style={{ marginBottom: 8 }}>
        <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 10 }}>Streak (week view)</div>
        <div style={{ display:'flex', gap: 6 }}>
          {['M','T','W','T','F','S','S'].map((d,i) => {
            const done = i < 4;
            const today = i === 4;
            return (
              <div key={i} style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius:'var(--r_2)',
                  background: done ? 'var(--accent_honor)' : today ? 'var(--surface_bg)' : 'var(--sunken_bg)',
                  border: today ? '1.5px dashed var(--accent_primary)' : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: done ? '#fff' : 'var(--tertiary_text)', fontSize: 14, fontWeight: 600,
                }}>
                  {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12l4 4 10-10"/></svg>}
                </div>
                <div className="mono" style={{ color:'var(--secondary_text)' }}>{d}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display:'flex', alignItems:'center', gap: 10 }}>
          <div className="ar" style={{ fontSize: 22, color:'var(--accent_honor)' }}>٤</div>
          <div style={{ fontSize: 13, color:'var(--secondary_text)' }}>4-day streak. Keep it warm.</div>
        </div>
      </div>
    </Section>
  </DCArtboard>
);

const Ring = ({ pct, muted }) => {
  const r = 22, c = 2*Math.PI*r;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--sunken_bg)" strokeWidth="5"/>
      <circle cx="30" cy="30" r={r} fill="none"
        stroke={muted ? 'var(--muted_text)' : 'var(--accent_primary)'}
        strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${c*pct/100} ${c}`}
        transform="rotate(-90 30 30)"/>
      <text x="30" y="34" textAnchor="middle" fontFamily="var(--f_mono)" fontSize="11" fill="var(--secondary_text)">{pct}%</text>
    </svg>
  );
};

// ── Lesson tile (in a map) ───────────────────────────────────
const LessonTile = () => (
  <DCArtboard id="lesson-tile" label="14 · Lesson tiles" width={680} height={520}>
    <Section kicker="Learning" title="Lesson tiles">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
        <Tile state="done" arabic="ا ب ت" title="The first family" sub="3 letters · 4 min" />
        <Tile state="active" arabic="ث ج ح" title="Dots and the hook" sub="3 letters · 5 min" />
        <Tile state="next" arabic="خ د ذ" title="Crossing the line" sub="3 letters · 6 min" />
        <Tile state="locked" arabic="ر ز س" title="Sliding tails" sub="locked" />
      </div>
    </Section>
  </DCArtboard>
);

const Tile = ({ state, arabic, title, sub }) => {
  const cfg = {
    done:   { bg:'var(--accent_primary_quiet)', stroke:'var(--accent_primary_quiet_border)', fg:'var(--accent_primary_hi)', badge:<Badge tone="success" dot>Done</Badge> },
    active: { bg:'var(--surface_bg)', stroke:'var(--accent_primary)', fg:'var(--primary_text)', badge:<Badge tone="sage" dot>In progress</Badge>, ring:true },
    next:   { bg:'var(--surface_bg)', stroke:'var(--subtle_stroke)', fg:'var(--primary_text)', badge:<Badge>Up next</Badge> },
    locked: { bg:'var(--page_bg)',stroke:'var(--subtle_stroke)', fg:'var(--muted_text)', badge:<Badge>Locked</Badge>, dim: true },
  }[state];
  return (
    <div style={{
      background: cfg.bg, border: `1.5px solid ${cfg.stroke}`,
      borderRadius:'var(--r_4)', padding: 18,
      boxShadow: cfg.ring ? '0 0 0 4px rgba(91,132,102,.08)' : 'none',
      opacity: cfg.dim ? .7 : 1,
    }}>
      <div className="ar" style={{ fontSize: 36, color: cfg.fg, lineHeight: 1, marginBottom: 14, letterSpacing: '6px' }}>{arabic}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: state==='locked' ? 'var(--tertiary_text)' : 'var(--primary_text)' }}>{title}</div>
      <div style={{ fontSize: 12, color:'var(--secondary_text)', marginTop: 2, marginBottom: 12 }}>{sub}</div>
      {cfg.badge}
    </div>
  );
};

// ── Tracing & Listening ───────────────────────────────────────
const TraceAndListen = () => (
  <DCArtboard id="trace-listen" label="15 · Tracing · Listening" width={1080} height={500}>
    <Section kicker="Learning" title="Practice modes">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24 }}>
        {/* Trace */}
        <div style={{ background:'var(--page_bg)', border:'1px solid var(--subtle_stroke)', borderRadius:'var(--r_4)', padding: 22 }}>
          <div className="row" style={{ justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Trace the letter</div>
            <Badge tone="sage" dot>Stroke 1 of 2</Badge>
          </div>
          <div style={{
            position:'relative', height: 200, background:'var(--surface_bg)',
            border:'1px solid var(--subtle_stroke)', borderRadius:'var(--r_3)', overflow:'hidden',
          }}>
            {/* baseline */}
            <div style={{ position:'absolute', left:'8%', right:'8%', top:'50%', height: 1, background:'var(--subtle_stroke)' }}/>
            {/* ghost glyph */}
            <div className="ar" style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 180, color:'var(--subtle_stroke)', lineHeight: 1 }}>ج</div>
            {/* user stroke */}
            <svg style={{ position:'absolute', inset:0 }} viewBox="0 0 400 200" fill="none">
              <path d="M120 80 C 160 80, 240 80, 280 110 C 290 120, 280 130, 260 130" stroke="var(--accent_primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="60"/>
            </svg>
          </div>
          <div style={{ marginTop: 14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>Start at the dot, follow the guide.</div>
            <div style={{ display:'flex', gap: 8 }}>
              <Btn kind="ghost" size="sm">Reset</Btn>
              <Btn kind="quiet" size="sm">Show stroke</Btn>
            </div>
          </div>
        </div>

        {/* Listen */}
        <div style={{ background:'var(--primary_text)', color:'var(--surface_bg)', borderRadius:'var(--r_4)', padding: 22 }}>
          <div className="row" style={{ justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Tap the letter you hear</div>
            <span className="mono" style={{ color:'rgba(245,231,200,.6)' }}>3 of 6</span>
          </div>

          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height: 110, position:'relative' }}>
            {/* breathing ring */}
            {[60, 80, 100].map((s,i)=>(
              <div key={i} style={{
                position:'absolute', width: s, height: s, borderRadius: 999,
                border:'1px solid rgba(154,182,156,.45)', opacity: 1 - i*0.25,
              }}/>
            ))}
            <div style={{ width: 56, height: 56, borderRadius: 999, background:'var(--accent_primary)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 6px rgba(91,132,102,.25)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color:'#fff' }}><path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2"/></svg>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10, marginTop: 18 }}>
            {['ت','ث','ب','ن'].map((l,i)=>(
              <div key={i} className="ar" style={{
                background: i===2 ? 'var(--accent_primary)' : 'rgba(245,231,200,.06)',
                border: '1px solid ' + (i===2 ? 'var(--primary_button_border)' : 'rgba(245,231,200,.15)'),
                borderRadius:'var(--r_3)', padding:'14px 0', textAlign:'center',
                fontSize: 36, color: i===2 ? '#fff' : 'var(--surface_bg)', cursor:'pointer',
              }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  </DCArtboard>
);

Object.assign(window, { LetterCard, Flashcard, ProgressBits, LessonTile, TraceAndListen });
