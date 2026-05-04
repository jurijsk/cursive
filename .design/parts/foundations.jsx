// foundations.jsx — color, type, spacing, radius, elevation, motion, illustration

const Cover = () => (
  <DCArtboard id={`cover`} label="00 · Cover" width={1080} height={680}>
    <div className="ab" style={{ position:'absolute', inset:0, background:'var(--page_bg)', padding:'72px 80px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
      <div className="row" style={{ justifyContent:'space-between', alignItems:'flex-start' }}>
        <div className="label-eyebrow">Cursive · Design System v0.1</div>
        <div className="mono" style={{ color:'var(--secondary_text)' }}>For Claude · MCP App</div>
      </div>

      <div>
        <div style={{ fontFamily:'var(--f_display)', fontSize: 132, lineHeight:.95, letterSpacing:'-0.03em', color:'var(--primary_text)' }}>
          Cursive.
        </div>
        <div className="ar" style={{ fontSize: 96, lineHeight: 1, marginTop: 12, color:'var(--accent_primary_hi)', fontWeight: 400 }}>
          اقرأ
        </div>
        <div style={{ marginTop: 28, fontSize: 20, lineHeight: 1.5, maxWidth: 640, color:'var(--secondary_text)' }}>
          A calm, embeddable system for teaching adults to read Arabic script — built around legibility, the rhythm of letter connections, and quiet moments of practice inside a chat.
        </div>
      </div>

      <div className="row" style={{ gap: 24, alignItems:'center' }}>
        <Pill>Sage / parchment</Pill>
        <Pill>Readex Pro · Inter</Pill>
        <Pill>RTL-aware</Pill>
        <Pill>MCP embeddable</Pill>
      </div>
    </div>
  </DCArtboard>
);

const Pill = ({ children }) => (
  <div style={{
    fontFamily:'var(--f_mono)', fontSize: 11, letterSpacing:'.04em',
    padding:'7px 12px', borderRadius:'var(--r_pill)',
    border:'1px solid var(--strong_stroke)', color:'var(--secondary_text)', background:'var(--surface_bg)'
  }}>{children}</div>
);

// ─── Color ────────────────────────────────────────────────────
const Swatch = ({ token, hex, name, dark }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth: 0 }}>
    <div style={{
      height: 76, borderRadius: 'var(--r_3)',
      background: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)',
    }} />
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color:'var(--primary_text)' }}>{name}</div>
      <div className="mono" style={{ color:'var(--secondary_text)' }}>{hex}</div>
    </div>
    <div className="mono" style={{ color:'var(--secondary_text)', fontSize: 10 }}>{token}</div>
  </div>
);

const ColorPalette = () => {
  const groups = [
    { name: 'Ink', kicker: 'Body, headings, deep surfaces', items: [
      ['----deep_cypress_ink',   '#1a2420', 'deep cypress ink'],
      ['----moss_shadow_ink',    '#2f3d36', 'moss shadow ink'],
      ['----sage_dust_ink',      '#56685e', 'sage dust ink'],
      ['----driftwood_grey_ink', '#7a8b80', 'driftwood grey'],
      ['----lichen_grey',        '#a3b1a7', 'lichen grey'],
      ['----river_stone_grey',   '#c8d1c9', 'river stone grey'],
      ['----morning_mist_grey',  '#e2e7e2', 'morning mist'],
    ]},
    { name: 'Paper', kicker: 'Backgrounds and surfaces', items: [
      ['----parchment_white', '#fbfaf6', 'parchment white'],
      ['----oat_paper',       '#f5f3ec', 'oat paper'],
      ['----flax_paper',      '#ecebe2', 'flax paper'],
      ['----linen_paper',     '#e0dfd3', 'linen paper'],
    ]},
    { name: 'Sage', kicker: 'The brand colour family', items: [
      ['----dew_sage',      '#eef3ee', 'dew sage'],
      ['----young_olive',   '#d8e3d8', 'young olive'],
      ['----meadow_sage',   '#9ab69c', 'meadow sage'],
      ['----oasis_sage',    '#5b8466', 'oasis sage'],
      ['----juniper_sage',  '#466a52', 'juniper sage'],
      ['----cypress_green', '#34503e', 'cypress green'],
      ['----forest_floor',  '#1d2e24', 'forest floor'],
    ]},
    { name: 'Saffron', kicker: 'Reserved — earned moments', items: [
      ['----saffron_silk',   '#f5e7c8', 'saffron silk'],
      ['----turmeric_gold',  '#c8923a', 'turmeric gold'],
    ]},
    { name: 'Functional', kicker: 'Status colours', items: [
      ['----olive_leaf_green', '#4f8a5c', 'olive leaf green'],
      ['----amber_warning',    '#b07c2a', 'amber warning'],
      ['----pomegranate_red',  '#a64338', 'pomegranate red'],
    ]},
  ];
  return (
    <DCArtboard id="palette" label="01 · Base colors" width={1080} height={820}>
      <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding:'48px 56px' }}>
        <div className="label-eyebrow">Base colors</div>
        <h2 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 40, margin:'8px 0 6px', letterSpacing:'-0.02em' }}>The palette, named</h2>
        <p style={{ color:'var(--secondary_text)', maxWidth: 680, fontSize: 14, lineHeight: 1.55, margin:'0 0 8px' }}>
          Base colors are ingredients, not finished dishes. They take the form <span className="mono" style={{ color:'var(--primary_text)' }}>----name</span> — the extra leading dash signals that no component should reference them directly. They exist only to define semantic colors.
        </p>
        <p style={{ color:'var(--tertiary_text)', maxWidth: 680, fontSize: 13, lineHeight: 1.55, margin:'0 0 28px', fontStyle:'italic' }}>
          Don’t use <span className="mono" style={{ fontStyle:'normal' }}>----oasis_sage</span> in a button. Use <span className="mono" style={{ fontStyle:'normal' }}>--primary_button_bg</span>, which references it.
        </p>

        {groups.map((g,i) => (
          <div key={i} style={{ marginBottom: 22 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color:'var(--primary_text)' }}>{g.name}</div>
              <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>{g.kicker}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.max(g.items.length,4)}, 1fr)`, gap: 10 }}>
              {g.items.map(([t,h,n],j) => <Swatch key={j} token={t} hex={h} name={n} />)}
            </div>
          </div>
        ))}
      </div>
    </DCArtboard>
  );
};

const SemanticTokens = () => {
  const groups = [
    { title: 'Surface', rows: [
      ['--page_bg',                '----oat_paper',          '#f5f3ec', 'App background'],
      ['--surface_bg',             '----parchment_white',    '#fbfaf6', 'Cards, sheets, fields'],
      ['--sunken_bg',              '----flax_paper',         '#ecebe2', 'Sunken wells, tracks'],
      ['--inverse_surface_bg',     '----deep_cypress_ink',   '#1a2420', 'Dark cards, focus letter'],
    ]},
    { title: 'Text', rows: [
      ['--primary_text',           '----deep_cypress_ink',   '#1a2420', 'Body & headings'],
      ['--secondary_text',         '----sage_dust_ink',      '#56685e', 'Supporting copy'],
      ['--tertiary_text',          '----driftwood_grey_ink', '#7a8b80', 'Hints, metadata'],
      ['--muted_text',             '----lichen_grey',        '#a3b1a7', 'Disabled, placeholders'],
      ['--inverse_text',           '----parchment_white',    '#fbfaf6', 'Text on inverse surface'],
      ['--on_primary_text',        '----parchment_white',    '#fbfaf6', 'Text on primary button'],
    ]},
    { title: 'Stroke', rows: [
      ['--subtle_stroke',          '----morning_mist_grey',  '#e2e7e2', 'Hairlines, dividers'],
      ['--strong_stroke',          '----river_stone_grey',   '#c8d1c9', 'Card borders, fields'],
    ]},
    { title: 'Primary button', rows: [
      ['--primary_button_bg',         '----oasis_sage',     '#5b8466', 'Default'],
      ['--hover_primary_button_bg',   '----juniper_sage',   '#466a52', 'Hover'],
      ['--pressed_primary_button_bg', '----cypress_green',  '#34503e', 'Pressed'],
      ['--primary_button_border',     '----juniper_sage',   '#466a52', '1px border'],
      ['--primary_button_text',       '----parchment_white','#fbfaf6', 'Label'],
    ]},
    { title: 'Secondary & quiet button', rows: [
      ['--secondary_button_bg',     '----parchment_white', '#fbfaf6', 'Default'],
      ['--hover_secondary_button_bg','----oat_paper',      '#f5f3ec', 'Hover'],
      ['--secondary_button_border', '----river_stone_grey','#c8d1c9', 'Border'],
      ['--secondary_button_text',   '----deep_cypress_ink','#1a2420', 'Label'],
      ['--quiet_button_bg',         '----dew_sage',        '#eef3ee', 'Tinted action'],
      ['--hover_quiet_button_bg',   '----young_olive',     '#d8e3d8', 'Hover'],
      ['--quiet_button_text',       '----cypress_green',   '#34503e', 'Label'],
    ]},
    { title: 'Field', rows: [
      ['--field_bg',                '----parchment_white', '#fbfaf6', 'Input background'],
      ['--field_border',            '----river_stone_grey','#c8d1c9', 'Default border'],
      ['--focus_field_border',      '----oasis_sage',      '#5b8466', 'Focused border'],
      ['--error_field_border',      '----pomegranate_red', '#a64338', 'Error border'],
    ]},
    { title: 'Accent & honor', rows: [
      ['--accent_primary',          '----oasis_sage',      '#5b8466', 'Links, progress, focus ring'],
      ['--accent_primary_hi',       '----cypress_green',   '#34503e', 'Hover/pressed accent'],
      ['--accent_primary_quiet',    '----dew_sage',        '#eef3ee', 'Selected rows, soft tints'],
      ['--accent_honor',            '----turmeric_gold',   '#c8923a', 'Streaks, mastery'],
      ['--accent_honor_quiet',      '----saffron_silk',    '#f5e7c8', 'Honor backgrounds'],
    ]},
    { title: 'Status', rows: [
      ['--success_color',           '----olive_leaf_green','#4f8a5c', 'Success'],
      ['--warn_color',              '----amber_warning',   '#b07c2a', 'Warn'],
      ['--error_color',             '----pomegranate_red', '#a64338', 'Error'],
    ]},
  ];
  return (
    <DCArtboard id="semantic" label="02 · Semantic tokens" width={920} height={1240}>
      <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding:'40px 36px', overflow:'hidden' }}>
        <div className="label-eyebrow">Semantic</div>
        <h2 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 34, margin:'6px 0 6px', letterSpacing:'-0.02em' }}>Tokens components use</h2>
        <p style={{ color:'var(--secondary_text)', maxWidth: 720, fontSize: 13, lineHeight: 1.55, margin:'0 0 22px' }}>
          Each semantic token is named after its <em>function</em> and resolves to exactly one base color. Components reference only this column. Swap a base, and every dependent surface updates in lockstep.
        </p>
        {groups.map((g,gi) => (
          <div key={gi} style={{ marginBottom: 18 }}>
            <div className="label-eyebrow" style={{ marginBottom: 8, color:'var(--primary_text)' }}>{g.title}</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 12 }}>
              <tbody>
                {g.rows.map(([sem, base, hex, use],i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--sunken_bg)' }}>
                    <td style={{ padding:'8px 0', width: 230 }}>
                      <span className="mono" style={{ color:'var(--primary_text)' }}>{sem}</span>
                    </td>
                    <td style={{ padding:'8px 0', width: 220 }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap: 8 }}>
                        <span className="swatch-dot" style={{ background: hex }} />
                        <span className="mono" style={{ color:'var(--secondary_text)' }}>{base}</span>
                      </span>
                    </td>
                    <td style={{ padding:'8px 0', width: 70 }}>
                      <span className="mono" style={{ color:'var(--tertiary_text)' }}>{hex}</span>
                    </td>
                    <td style={{ padding:'8px 0', color:'var(--secondary_text)' }}>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </DCArtboard>
  );
};

// ─── Type ─────────────────────────────────────────────────────
const TypePairing = () => (
  <DCArtboard id="type" label="03 · Type pairing" width={1080} height={760}>
    <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding:'48px 56px' }}>
      <div className="label-eyebrow">Type</div>
      <h2 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 40, margin:'8px 0 6px', letterSpacing:'-0.02em' }}>Two voices, one rhythm</h2>
      <p style={{ color:'var(--secondary_text)', maxWidth: 700, fontSize: 14, lineHeight: 1.55, margin:'0 0 28px' }}>
        Inter handles the UI — sentences, labels, ratios. Readex Pro carries the script — wide aperture, low contrast, modern but warm. Fraunces appears only at display sizes for chapter titles and brand moments.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 32 }}>
        {/* Latin */}
        <div>
          <div className="label-eyebrow" style={{ marginBottom: 10 }}>Latin · Inter</div>
          <div style={{ borderTop:'1px solid var(--subtle_stroke)' }}>
            {[
              { name:'Display/L', size: 48, weight: 600, line: 1.05, ls: '-0.02em', sample: 'Read Arabic.' },
              { name:'Display/S', size: 32, weight: 600, line: 1.1,  ls: '-0.015em', sample: 'Today’s lesson' },
              { name:'Title',    size: 22, weight: 600, line: 1.2,  ls: '-0.01em',  sample: 'Letters that connect' },
              { name:'Body',     size: 16, weight: 400, line: 1.55, ls: '0',        sample: 'Three letters of the family ب — bāʾ, tāʾ, thāʾ — share one skeleton.' },
              { name:'Caption',  size: 12, weight: 500, line: 1.4,  ls: '.01em',    sample: 'Tap a letter to hear it.' },
              { name:'Mono',     size: 11, weight: 400, line: 1.4,  ls: '.04em',    sample: 'XP +12 · streak 4', mono: true },
            ].map((t,i) => (
              <div key={i} style={{ padding:'14px 0', borderBottom:'1px solid var(--sunken_bg)', display:'grid', gridTemplateColumns:'90px 1fr', gap: 16, alignItems:'baseline' }}>
                <div className="mono" style={{ color:'var(--secondary_text)' }}>{t.name}<br/><span style={{opacity:.7}}>{t.size}/{Math.round(t.size*t.line)}</span></div>
                <div style={{
                  fontFamily: t.mono ? 'var(--f_mono)' : 'var(--f_ui)',
                  fontSize: t.size, fontWeight: t.weight, lineHeight: t.line, letterSpacing: t.ls,
                  color:'var(--primary_text)'
                }}>{t.sample}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arabic */}
        <div>
          <div className="label-eyebrow" style={{ marginBottom: 10 }}>Arabic · Readex Pro</div>
          <div style={{ borderTop:'1px solid var(--subtle_stroke)' }}>
            {[
              { name:'Hero',    size: 96, weight: 400, line: 1.0, sample: 'بسم' },
              { name:'Letter',  size: 64, weight: 400, line: 1.0, sample: 'كَتَبَ' },
              { name:'Title',   size: 28, weight: 500, line: 1.4, sample: 'حروف الهجاء' },
              { name:'Body',    size: 20, weight: 400, line: 1.8, sample: 'القراءة لذيذة. الكتابة أبدية.' },
              { name:'Caption', size: 14, weight: 400, line: 1.6, sample: 'حرف الباء' },
              { name:'Mark',    size: 22, weight: 500, line: 1.0, sample: 'مَ', color: 'var(--accent_primary_hi)' },
            ].map((t,i) => (
              <div key={i} style={{ padding:'14px 0', borderBottom:'1px solid var(--sunken_bg)', display:'grid', gridTemplateColumns:'90px 1fr', gap: 16, alignItems:'baseline' }}>
                <div className="mono" style={{ color:'var(--secondary_text)' }}>{t.name}<br/><span style={{opacity:.7}}>{t.size}/{Math.round(t.size*t.line)}</span></div>
                <div className="ar" style={{
                  fontFamily:'var(--f_arabic)',
                  fontSize: t.size, fontWeight: t.weight, lineHeight: t.line,
                  color: t.color || 'var(--primary_text)', textAlign:'right'
                }}>{t.sample}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </DCArtboard>
);

// ─── Spacing / Radius / Elevation ─────────────────────────────
const SpacingRadiusElevation = () => {
  const space = [
    ['1','4px'],['2','8px'],['3','12px'],['4','16px'],
    ['5','24px'],['6','32px'],['7','48px'],['8','64px'],
  ];
  // Read live so the Tweaks panel's radius edits flow through.
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const onMsg = (e) => { if (e.data && e.data.type === '__tweaks_radius_changed') setTick(t=>t+1); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const cssVar = (name) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };
  const radii = [
    ['r_1', cssVar('--r_1') || '4px'],
    ['r_2', cssVar('--r_2') || '8px'],
    ['r_3', cssVar('--r_3') || '12px'],
    ['r_4', cssVar('--r_4') || '16px'],
    ['r_5', cssVar('--r_5') || '16px'],
    ['r_button', cssVar('--r_button') || '8px'],
    ['r_pill', '999px'],
  ];
  const elev = [
    ['e_1','Hairline lift', 'var(--e_1)'],
    ['e_2','Cards & tiles', 'var(--e_2)'],
    ['e_3','Floating sheets', 'var(--e_3)'],
  ];
  return (
    <DCArtboard id="space" label="04 · Spacing · Radius · Elevation" width={1080} height={620}>
      <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding:'48px 56px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 36 }}>
        <div>
          <div className="label-eyebrow">Spacing</div>
          <h3 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 26, margin:'6px 0 16px', letterSpacing:'-0.01em' }}>4-pt rhythm</h3>
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            {space.map(([k,v]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap: 12 }}>
                <span className="mono" style={{ width: 32, color:'var(--secondary_text)' }}>s_{k}</span>
                <span style={{ height: 14, width: v, background:'var(--progress_fill_inverse_bg)', borderRadius: 2 }} />
                <span className="mono" style={{ color:'var(--secondary_text)' }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color:'var(--secondary_text)', marginTop: 14, lineHeight: 1.5 }}>
            Pages breathe with s_6/s_7. Inside cards, s_3/s_4. Letter-card grids use s_2 to keep the cluster tight.
          </p>
        </div>

        <div>
          <div className="label-eyebrow">Radius</div>
          <h3 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 26, margin:'6px 0 16px', letterSpacing:'-0.01em' }}>Soft, never round</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 12 }}>
            {radii.map(([k,v]) => (
              <div key={k} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
                <div style={{
                  width: 70, height: 60,
                  background:'var(--accent_primary_quiet)',
                  border:'1px solid var(--accent_primary_quiet_border)',
                  borderRadius: v,
                }} />
                <span className="mono" style={{ color:'var(--secondary_text)' }}>{k}</span>
                <span className="mono" style={{ color:'var(--tertiary_text)', fontSize: 10 }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color:'var(--secondary_text)', marginTop: 18, lineHeight: 1.5 }}>
            Letter cards use r-3. Sheets and modals r-4. Pills (r-pill) are reserved for status, not buttons.
          </p>
        </div>

        <div>
          <div className="label-eyebrow">Elevation</div>
          <h3 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 26, margin:'6px 0 16px', letterSpacing:'-0.01em' }}>Three steps</h3>
          <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
            {elev.map(([k,desc,sh]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap: 14 }}>
                <div style={{ width: 80, height: 60, background:'var(--surface_bg)', borderRadius:'var(--r_3)', boxShadow: sh, border:'1px solid var(--subtle_stroke)' }} />
                <div>
                  <div className="mono" style={{ color:'var(--secondary_text)' }}>--{k}</div>
                  <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DCArtboard>
  );
};

// ─── Iconography ──────────────────────────────────────────────
const Icon = ({ name, children }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 8 }}>
    <div style={{ width: 56, height: 56, borderRadius:'var(--r_3)', background:'var(--page_bg)', border:'1px solid var(--subtle_stroke)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--secondary_text)' }}>
        {children}
      </svg>
    </div>
    <div className="mono" style={{ color:'var(--secondary_text)' }}>{name}</div>
  </div>
);

const Iconography = () => (
  <DCArtboard id="icons" label="05 · Iconography" width={680} height={460}>
    <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding:'40px 36px' }}>
      <div className="label-eyebrow">Icons</div>
      <h3 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 26, margin:'6px 0 6px', letterSpacing:'-0.01em' }}>1.5pt line, soft caps</h3>
      <p style={{ fontSize: 12, color:'var(--secondary_text)', margin:'0 0 22px', lineHeight: 1.5 }}>
        24-grid, monoline, rounded joinery. Icons ride below text — they never replace nouns the user is learning.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 16 }}>
        <Icon name="lesson"><path d="M4 5h16v14H4z"/><path d="M4 9h16"/></Icon>
        <Icon name="speak"><path d="M3 10v4"/><path d="M7 7v10"/><path d="M11 4v16"/><path d="M15 8v8"/><path d="M19 11v2"/></Icon>
        <Icon name="trace"><path d="M4 17c4 0 4-10 8-10s4 10 8 10"/></Icon>
        <Icon name="card"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></Icon>
        <Icon name="streak"><path d="M12 3c2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 1 2 3 1 3-5z"/></Icon>
        <Icon name="check"><path d="M5 12l4 4 10-10"/></Icon>
        <Icon name="pause"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></Icon>
        <Icon name="restart"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></Icon>
        <Icon name="book"><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M4 18h14"/></Icon>
        <Icon name="lock"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></Icon>
        <Icon name="ear"><path d="M8 9a4 4 0 0 1 8 0c0 3-2 3-2 6a2 2 0 0 1-4 0"/><path d="M8 14c-2 0-3 2-3 4"/></Icon>
        <Icon name="sparkle"><path d="M12 4v6M12 14v6M4 12h6M14 12h6"/></Icon>
      </div>
    </div>
  </DCArtboard>
);

// ─── Motion principles ────────────────────────────────────────
const Motion = () => (
  <DCArtboard id="motion" label="06 · Motion" width={680} height={460}>
    <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding:'40px 36px' }}>
      <div className="label-eyebrow">Motion</div>
      <h3 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 26, margin:'6px 0 6px', letterSpacing:'-0.01em' }}>Like a hand, drawing</h3>
      <p style={{ fontSize: 12, color:'var(--secondary_text)', margin:'0 0 18px', lineHeight: 1.5 }}>
        Motion follows the calligrapher’s hand: a single confident stroke, then stillness. No bounces, no overshoots.
      </p>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 12 }}>
        <tbody>
          {[
            ['fast',    '120ms','cubic-bezier(.2,.7,.3,1)','Hover, taps, microtransitions'],
            ['base',    '220ms','cubic-bezier(.2,.7,.3,1)','Card flips, panel slides'],
            ['slow',    '420ms','cubic-bezier(.4,0,.2,1)', 'Letter strokes, mastery reveal'],
            ['breathe','1800ms','ease-in-out',             'Idle prompts, listening rings'],
          ].map(([n,d,e,u],i)=>(
            <tr key={i} style={{ borderBottom:'1px solid var(--sunken_bg)' }}>
              <td style={{ padding:'10px 0' }}><span className="mono" style={{ color:'var(--primary_text)' }}>--m-{n}</span></td>
              <td style={{ padding:'10px 0' }}><span className="mono" style={{ color:'var(--secondary_text)' }}>{d}</span></td>
              <td style={{ padding:'10px 0' }}><span className="mono" style={{ color:'var(--secondary_text)' }}>{e}</span></td>
              <td style={{ padding:'10px 0', color:'var(--secondary_text)' }}>{u}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 18, padding: 14, borderRadius:'var(--r_3)', background:'var(--accent_primary_quiet)', border:'1px solid var(--accent_primary_quiet_border)', fontSize: 12, color:'var(--accent_primary_hi)', lineHeight: 1.5 }}>
        Reduced-motion: replace stroke draws with cross-fades; keep the breathe pulse but freeze its scale.
      </div>
    </div>
  </DCArtboard>
);

// ─── Illustration / imagery ───────────────────────────────────
const Illustration = () => (
  <DCArtboard id="imagery" label="07 · Illustration & imagery" width={1080} height={460}>
    <div className="ab" style={{ position:'absolute', inset:0, background:'var(--surface_bg)', padding:'40px 56px' }}>
      <div className="label-eyebrow">Imagery</div>
      <h3 style={{ fontFamily:'var(--f_display)', fontWeight: 400, fontSize: 26, margin:'6px 0 6px', letterSpacing:'-0.01em' }}>The script is the picture</h3>
      <p style={{ fontSize: 12, color:'var(--secondary_text)', margin:'0 0 22px', lineHeight: 1.5, maxWidth: 720 }}>
        Cursive avoids decorative illustration. Hero moments use the letterforms themselves at large scale, on textured parchment. Photography, when used, is shallow-focus: ink, paper, hands.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap: 16 }}>
        {/* Hero letter */}
        <div style={{ height: 230, borderRadius:'var(--r_4)', background:'var(--page_bg)', border:'1px solid var(--subtle_stroke)', overflow:'hidden', position:'relative' }}>
          <div style={{
            position:'absolute', inset:0,
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(91,132,102,.04) 0 2px, transparent 2px 8px)',
          }}/>
          <div className="ar" style={{ position:'absolute', right: 28, bottom: -10, fontSize: 240, color:'var(--accent_primary_hi)', lineHeight: 1, fontWeight: 400 }}>ك</div>
          <div className="mono" style={{ position:'absolute', left: 14, top: 12, color:'var(--secondary_text)' }}>hero/letter</div>
        </div>
        {/* Photo placeholder — striped */}
        <div style={{
          height: 230, borderRadius:'var(--r_4)',
          background:
            'repeating-linear-gradient(45deg, var(--subtle_stroke) 0 1px, transparent 1px 14px), var(--page_bg)',
          border:'1px solid var(--subtle_stroke)', position:'relative'
        }}>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="mono" style={{ color:'var(--secondary_text)', background:'var(--surface_bg)', padding:'4px 8px', borderRadius:'var(--r_1)', border:'1px solid var(--subtle_stroke)' }}>
              photo · ink on paper
            </span>
          </div>
        </div>
        {/* Pattern */}
        <div style={{ height: 230, borderRadius:'var(--r_4)', overflow:'hidden', border:'1px solid var(--subtle_stroke)', position:'relative', background:'var(--accent_primary_hi)' }}>
          <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.4" fill="rgba(245,231,200,.35)"/>
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#dots)"/>
          </svg>
          <div className="mono" style={{ position:'absolute', left: 14, top: 12, color:'rgba(245,231,200,.7)' }}>pattern/halftone</div>
        </div>
      </div>
    </div>
  </DCArtboard>
);

Object.assign(window, { Cover, ColorPalette, SemanticTokens, TypePairing, SpacingRadiusElevation, Iconography, Motion, Illustration });
