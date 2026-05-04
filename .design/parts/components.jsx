// components.jsx — core components: buttons, inputs, cards, badges, tabs, toasts

const Section = ({ title, kicker, children, padding = '40px 36px' }) => (
  <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding, overflow:'hidden' }}>
    <div className="label-eyebrow">{kicker}</div>
    <h3 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 26, margin:'6px 0 18px', letterSpacing:'-0.01em' }}>{title}</h3>
    {children}
  </div>
);

// ── Buttons ───────────────────────────────────────────────────
const Btn = ({ kind = 'primary', size = 'md', children, leading, trailing, disabled }) => {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13, gap: 6, r: 'var(--r_button)' },
    md: { h: 40, px: 16, fs: 14, gap: 8, r: 'var(--r_button)' },
    lg: { h: 52, px: 22, fs: 15, gap: 10, r: 'var(--r_button)' },
  }[size];
  const variants = {
    primary: { bg:'var(--accent_primary)', color:'var(--surface_bg)', border:'1px solid var(--primary_button_border)', shadow:'var(--e_1)' },
    secondary: { bg:'var(--surface_bg)', color:'var(--primary_text)', border:'1px solid var(--strong_stroke)', shadow:'var(--e_1)' },
    ghost: { bg:'transparent', color:'var(--secondary_text)', border:'1px solid transparent', shadow:'none' },
    quiet: { bg:'var(--accent_primary_quiet)', color:'var(--accent_primary_hi)', border:'1px solid var(--accent_primary_quiet_border)', shadow:'none' },
    danger: { bg:'var(--surface_bg)', color:'var(--error_color)', border:'1px solid #e7c8c4', shadow:'var(--e_1)' },
  }[kind];
  return (
    <button disabled={disabled} style={{
      height: sizes.h, padding: `0 ${sizes.px}px`, fontSize: sizes.fs,
      gap: sizes.gap, borderRadius: sizes.r,
      background: variants.bg, color: variants.color, border: variants.border, boxShadow: variants.shadow,
      fontFamily:'var(--f_ui)', fontWeight: 500, letterSpacing:'-0.005em',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
    }}>
      {leading}{children}{trailing}
    </button>
  );
};

const Buttons = () => (
  <DCArtboard id="buttons" label="08 · Buttons" width={680} height={480}>
    <Section kicker="Components" title="Buttons">
      <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
        <Row label="Primary">
          <Btn size="lg">Start lesson</Btn>
          <Btn>Continue</Btn>
          <Btn size="sm">Next</Btn>
          <Btn disabled>Locked</Btn>
        </Row>
        <Row label="Secondary">
          <Btn kind="secondary" size="lg">Skip</Btn>
          <Btn kind="secondary">Hear it</Btn>
          <Btn kind="secondary" size="sm">Show hint</Btn>
        </Row>
        <Row label="Quiet">
          <Btn kind="quiet">Reveal answer</Btn>
          <Btn kind="quiet" size="sm">+ add card</Btn>
        </Row>
        <Row label="Ghost">
          <Btn kind="ghost">Cancel</Btn>
          <Btn kind="ghost" size="sm">Undo</Btn>
        </Row>
        <Row label="Danger">
          <Btn kind="danger" size="sm">Reset progress</Btn>
        </Row>
      </div>
      <p style={{ fontSize: 12, color:'var(--secondary_text)', marginTop: 22, lineHeight: 1.5, maxWidth: 540 }}>
        Primary is the only sage-coloured button on a screen. If you need a second emphatic action, escalate it with size, not colour.
      </p>
    </Section>
  </DCArtboard>
);

const Row = ({ label, children }) => (
  <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
    <div className="mono" style={{ width: 76, color:'var(--secondary_text)' }}>{label}</div>
    <div style={{ display:'flex', gap: 10, flexWrap:'wrap', alignItems:'center' }}>{children}</div>
  </div>
);

// ── Inputs ────────────────────────────────────────────────────
const Field = ({ label, hint, value, placeholder, state, trailing, dir }) => {
  const ring =
    state === 'focus' ? '0 0 0 3px rgba(91,132,102,.18)' :
    state === 'error' ? '0 0 0 3px rgba(166,67,56,.15)' : 'none';
  const border =
    state === 'focus' ? 'var(--accent_primary)' :
    state === 'error' ? 'var(--error_color)' : 'var(--strong_stroke)';
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color:'var(--secondary_text)', marginBottom: 6 }}>{label}</div>
      <div style={{
        display:'flex', alignItems:'center',
        height: 44, borderRadius:'var(--r_2)',
        background:'var(--surface_bg)', border:`1px solid ${border}`,
        boxShadow: ring,
        padding:'0 12px',
      }}>
        <input dir={dir} defaultValue={value} placeholder={placeholder}
          style={{ flex: 1, border:'none', outline:'none', background:'transparent',
            fontFamily: dir === 'rtl' ? 'var(--f_arabic)' : 'var(--f_ui)',
            fontSize: dir === 'rtl' ? 18 : 14, color:'var(--primary_text)' }}
        />
        {trailing}
      </div>
      {hint && <div style={{ fontSize: 11, color: state === 'error' ? 'var(--error_color)' : 'var(--secondary_text)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
};

const Inputs = () => (
  <DCArtboard id="inputs" label="09 · Inputs" width={680} height={520}>
    <Section kicker="Components" title="Fields">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 18 }}>
        <Field label="Display name" value="Layla" hint="This is how Cursive will greet you." />
        <Field label="Daily goal (minutes)" value="10" state="focus" hint="Focused state" />
        <Field label="Type the letter you hear" placeholder="ب" dir="rtl" state="focus" />
        <Field label="Pair code" value="ABCXY" state="error" hint="That code doesn’t match." />
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color:'var(--secondary_text)', marginBottom: 8 }}>Choice chips</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
          {['I’m new to Arabic','I know some letters','I can sound out words','I want to read Quran','For travel','Heritage'].map((c,i)=>(
            <div key={i} style={{
              fontSize: 13, padding:'8px 14px', borderRadius:'var(--r_pill)',
              background: i===0 ? 'var(--accent_primary)' : 'var(--surface_bg)',
              color: i===0 ? 'var(--surface_bg)' : 'var(--secondary_text)',
              border: i===0 ? '1px solid var(--primary_button_border)' : '1px solid var(--strong_stroke)',
            }}>{c}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color:'var(--secondary_text)', marginBottom: 8 }}>Toggle</div>
        <div style={{ display:'flex', gap: 16, alignItems:'center' }}>
          {[true,false].map((on,i)=>(
            <div key={i} style={{
              width: 40, height: 24, borderRadius: 999,
              background: on ? 'var(--accent_primary)' : 'var(--strong_stroke)',
              position:'relative', transition:'background .12s',
            }}>
              <div style={{
                position:'absolute', top: 2, left: on ? 18 : 2,
                width: 20, height: 20, borderRadius: 999, background:'var(--surface_bg)',
                boxShadow:'var(--e_1)',
              }}/>
            </div>
          ))}
          <span style={{ fontSize: 13, color:'var(--secondary_text)' }}>Show diacritical marks (ḥarakāt)</span>
        </div>
      </div>
    </Section>
  </DCArtboard>
);

// ── Cards / Badges / Tabs / Toast ─────────────────────────────
const Badge = ({ tone='neutral', children, dot }) => {
  const tones = {
    neutral: { bg:'var(--sunken_bg)', color:'var(--secondary_text)', dot:'var(--tertiary_text)' },
    sage:    { bg:'var(--accent_primary_quiet)',   color:'var(--accent_primary_hi)', dot:'var(--accent_primary)' },
    saffron: { bg:'#f8eed3',            color:'#7a5a14',           dot:'var(--accent_honor)' },
    success: { bg:'#e3eee3',            color:'#2e5d3a',           dot:'var(--success_color)' },
  }[tone];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 6,
      fontSize: 11, fontWeight: 500, padding:'4px 10px', borderRadius:'var(--r_pill)',
      background: tones.bg, color: tones.color,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: tones.dot }} />}
      {children}
    </span>
  );
};

const ComponentsExtras = () => (
  <DCArtboard id="extras" label="10 · Cards · Badges · Tabs · Toast" width={1080} height={520}>
    <Section kicker="Components" title="Containers, status, navigation">
      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap: 24 }}>
        {/* Card examples */}
        <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
          <div className="mono" style={{ color:'var(--secondary_text)' }}>Cards</div>

          <div style={{
            background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)',
            borderRadius:'var(--r_4)', padding: 18, boxShadow:'var(--e_1)',
            display:'flex', alignItems:'center', gap: 16,
          }}>
            <div className="ar" style={{ fontSize: 56, color:'var(--accent_primary_hi)' }}>ج</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Jīm</div>
              <div style={{ fontSize: 13, color:'var(--secondary_text)' }}>The hooked sister of ḥāʾ and khāʾ.</div>
            </div>
            <Badge tone="sage" dot>Learning</Badge>
          </div>

          <div style={{
            background:'var(--page_bg)', border:'1px solid var(--subtle_stroke)',
            borderRadius:'var(--r_4)', padding: 18,
            display:'flex', alignItems:'center', gap: 16,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color:'var(--secondary_text)' }}><path d="M4 5h16v14H4z"/><path d="M4 9h16"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Lesson 4 · Connecting letters</div>
              <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>5 min · 8 cards</div>
            </div>
            <Btn kind="quiet" size="sm">Resume</Btn>
          </div>

          <div style={{
            background:'var(--primary_text)', color:'var(--surface_bg)',
            borderRadius:'var(--r_4)', padding: 22,
            display:'flex', alignItems:'center', gap: 18,
          }}>
            <div style={{ flex: 1 }}>
              <div className="label-eyebrow" style={{ color:'rgba(245,231,200,.7)' }}>Mastery</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>You can now read four-letter clusters.</div>
            </div>
            <div className="ar" style={{ fontSize: 44, color:'var(--accent_honor)' }}>كَتَبَ</div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
          <div>
            <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 8 }}>Badges</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
              <Badge>Initial</Badge>
              <Badge tone="sage" dot>New</Badge>
              <Badge tone="success" dot>Mastered</Badge>
              <Badge tone="saffron" dot>5-day streak</Badge>
            </div>
          </div>

          <div>
            <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 8 }}>Tabs</div>
            <div style={{
              display:'inline-flex', padding: 4, gap: 2,
              background:'var(--sunken_bg)', borderRadius:'var(--r_pill)',
            }}>
              {['Letters','Words','Reading'].map((t,i) => (
                <div key={i} style={{
                  padding:'6px 14px', borderRadius:'var(--r_pill)', fontSize: 13, fontWeight: 500,
                  background: i===0 ? 'var(--surface_bg)' : 'transparent',
                  color: i===0 ? 'var(--primary_text)' : 'var(--secondary_text)',
                  boxShadow: i===0 ? 'var(--e_1)' : 'none',
                }}>{t}</div>
              ))}
            </div>
          </div>

          <div>
            <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 8 }}>Toast</div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap: 12,
              background:'var(--primary_text)', color:'var(--surface_bg)',
              padding:'12px 16px', borderRadius:'var(--r_3)', boxShadow:'var(--e_3)', maxWidth: 360,
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background:'var(--accent_primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l4 4 10-10"/></svg>
              </div>
              <div style={{ fontSize: 13 }}>Saved to your deck. <span style={{ opacity:.7 }}>Undo</span></div>
            </div>
          </div>

          <div>
            <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 8 }}>List item</div>
            <div style={{
              background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)', borderRadius:'var(--r_3)',
              padding:'10px 14px', display:'flex', alignItems:'center', gap: 14,
            }}>
              <div className="ar" style={{ fontSize: 26, color:'var(--primary_text)', width: 36, textAlign:'center' }}>ت</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>tāʾ</div>
                <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>Two dots above · /t/</div>
              </div>
              <Badge tone="success" dot>92%</Badge>
            </div>
          </div>
        </div>
      </div>
    </Section>
  </DCArtboard>
);

Object.assign(window, { Buttons, Inputs, ComponentsExtras, Btn, Field, Badge, Section });
