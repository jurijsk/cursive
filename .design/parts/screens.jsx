// screens.jsx — Home / Lesson Map sample screen, in a clean rounded frame

const HomeScreen = () => (
  <DCArtboard id="home" label="16 · Home / Lesson map" width={420} height={860}>
    <div className="ab" style={{ position:'absolute', inset:0, background:'var(--page_bg)', display:'flex', flexDirection:'column' }}>

      {/* status / app bar */}
      <div style={{ padding:'16px 20px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius:'var(--r_2)',
            background:'var(--accent_primary_hi)', color:'var(--accent_honor_quiet)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span className="ar" style={{ fontSize: 22, lineHeight: 1 }}>ك</span>
          </div>
          <div style={{ fontFamily:'var(--f_display)', fontSize: 18, fontWeight: 500, letterSpacing:'-0.01em' }}>Cursive</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 4, padding:'4px 10px', background:'#f8eed3', borderRadius:'var(--r_pill)', color:'#7a5a14', fontSize: 12, fontWeight: 600 }}>
            <span>4</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 1 2 3 1 3-5z"/></svg>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 999, background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)' }}/>
        </div>
      </div>

      {/* greeting */}
      <div style={{ padding:'12px 20px 4px' }}>
        <div className="label-eyebrow">Tuesday · day 4</div>
        <h1 style={{ fontFamily:'var(--f_display)', fontSize: 30, fontWeight: 400, margin:'4px 0 4px', letterSpacing:'-0.02em' }}>
          Welcome back, Layla.
        </h1>
        <p style={{ margin:'0', fontSize: 13, color:'var(--secondary_text)', lineHeight: 1.5 }}>
          You’re halfway through the second family. Today’s lesson takes 5 minutes.
        </p>
      </div>

      {/* hero continue card */}
      <div style={{ margin:'14px 20px 0' }}>
        <div style={{
          background:'var(--primary_text)', color:'var(--surface_bg)',
          borderRadius:'var(--r_4)', padding: 18, position:'relative', overflow:'hidden',
          boxShadow:'var(--e_2)',
        }}>
          <div className="ar" style={{ position:'absolute', right: -10, bottom: -30, fontSize: 180, color:'rgba(154,182,156,.18)', lineHeight: 1, fontWeight: 400 }}>ج</div>
          <div style={{ position:'relative' }}>
            <div className="label-eyebrow" style={{ color:'rgba(245,231,200,.6)' }}>Continue</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4 }}>Dots and the hook</div>
            <div style={{ fontSize: 12, color:'rgba(245,231,200,.6)', marginTop: 4 }}>3 of 8 cards · ث ج ح</div>
            <div style={{ height: 4, background:'rgba(245,231,200,.15)', borderRadius: 4, marginTop: 14, overflow:'hidden' }}>
              <div style={{ width:'38%', height:'100%', background:'var(--progress_fill_inverse_bg)' }} />
            </div>
            <div style={{ marginTop: 16 }}>
              <button style={{
                background:'var(--accent_honor_quiet)', color:'var(--primary_text)',
                border:'none', height: 38, padding:'0 18px', borderRadius:'var(--r_2)',
                fontFamily:'var(--f_ui)', fontSize: 13, fontWeight: 600, cursor:'pointer',
              }}>Resume → 5 min</button>
            </div>
          </div>
        </div>
      </div>

      {/* alphabet path */}
      <div style={{ padding:'20px 20px 12px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div>
          <div className="label-eyebrow">The path</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>28 letters · 7 families</div>
        </div>
        <div className="mono" style={{ color:'var(--secondary_text)' }}>5 / 28</div>
      </div>

      <div style={{ padding:'0 20px 8px', display:'flex', flexWrap:'wrap', gap: 6 }}>
        {[
          ['ا','done'],['ب','done'],['ت','done'],['ث','done'],['ج','active'],
          ['ح','next'],['خ','locked'],['د','locked'],['ذ','locked'],['ر','locked'],
          ['ز','locked'],['س','locked'],['ش','locked'],['ص','locked'],['ض','locked'],
        ].map(([g,s],i) => {
          const cfg = {
            done:   { bg:'var(--accent_primary)', color:'#fff', border:'transparent' },
            active: { bg:'var(--surface_bg)', color:'var(--primary_text)', border:'var(--accent_primary)' },
            next:   { bg:'var(--surface_bg)', color:'var(--primary_text)', border:'var(--strong_stroke)' },
            locked: { bg:'var(--sunken_bg)', color:'var(--muted_text)', border:'transparent' },
          }[s];
          return (
            <div key={i} className="ar" style={{
              width: 44, height: 44, borderRadius:'var(--r_2)',
              background: cfg.bg, color: cfg.color,
              border: `1.5px solid ${cfg.border}`,
              boxShadow: s==='active' ? '0 0 0 3px rgba(91,132,102,.15)' : 'none',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22,
            }}>{g}</div>
          );
        })}
      </div>

      {/* daily practice */}
      <div style={{ padding:'12px 20px' }}>
        <div className="label-eyebrow" style={{ marginBottom: 8 }}>Daily practice</div>
        <div style={{
          background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)',
          borderRadius:'var(--r_3)', padding:'12px 14px',
          display:'flex', alignItems:'center', gap: 12,
        }}>
          <div className="ar" style={{ fontSize: 26, color:'var(--accent_primary_hi)', width: 36, textAlign:'center' }}>ت</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Review · 6 cards due</div>
            <div style={{ fontSize: 11, color:'var(--secondary_text)' }}>~ 3 min · spaced repetition</div>
          </div>
          <button style={{ background:'var(--accent_primary_quiet)', border:'1px solid var(--accent_primary_quiet_border)', color:'var(--accent_primary_hi)', height: 30, padding:'0 12px', borderRadius:'var(--r_2)', fontSize: 12, fontWeight: 600, cursor:'pointer' }}>Start</button>
        </div>
      </div>

      {/* tab bar */}
      <div style={{ marginTop:'auto', borderTop:'1px solid var(--subtle_stroke)', background:'var(--surface_bg)', padding:'10px 20px 16px', display:'flex', justifyContent:'space-between' }}>
        {[
          ['Learn','M4 5h16v14H4z|M4 9h16', true],
          ['Cards','M3 5h18v14H3z|M3 10h18', false],
          ['Listen','M3 10v4|M7 7v10|M11 4v16|M15 8v8', false],
          ['You','M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M5 20a7 7 0 0 1 14 0', false],
        ].map(([n,d,active],i)=>(
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 4, color: active ? 'var(--accent_primary_hi)' : 'var(--tertiary_text)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {d.split('|').map((p,j) => <path key={j} d={p}/>)}
            </svg>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{n}</div>
          </div>
        ))}
      </div>
    </div>
  </DCArtboard>
);

Object.assign(window, { HomeScreen });
