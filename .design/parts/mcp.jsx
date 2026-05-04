// mcp.jsx — Cursive embedded inside a Claude chat surface (MCP App embed)

const McpEmbed = () => (
  <DCArtboard id="mcp" label="17 · MCP chat embed" width={760} height={780}>
    <div className="ab mcp-bg" style={{ position:'absolute', inset:0, padding:'24px 28px' }}>

      {/* User message */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom: 14 }}>
        <div style={{
          maxWidth: 480, background:'var(--surface_bg)',
          border:'1px solid var(--subtle_stroke)', borderRadius: '16px 16px 4px 16px',
          padding:'10px 14px', fontSize: 14, color:'var(--primary_text)',
        }}>
          Help me learn the next Arabic letter.
        </div>
      </div>

      {/* Claude message + tool */}
      <div style={{ display:'flex', alignItems:'flex-start', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 999, background:'#c96442', flex:'none', marginTop: 4 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color:'var(--secondary_text)', lineHeight: 1.55, marginBottom: 10 }}>
            Sure — based on where you left off, the next letter is <b>jīm (ج)</b>. I’ll open a Cursive card so you can practice it inline.
          </div>

          {/* MCP App tool call header */}
          <div style={{
            display:'flex', alignItems:'center', gap: 8, marginBottom: 6,
            color:'var(--secondary_text)', fontFamily:'var(--f_mono)', fontSize: 11,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l4 4 10-10"/></svg>
            cursive · letter_card &nbsp;·&nbsp; ج
          </div>

          {/* Embedded card */}
          <div style={{
            background:'var(--surface_bg)',
            border:'1px solid var(--subtle_stroke)',
            borderRadius:'var(--r_4)', overflow:'hidden', boxShadow:'var(--e_1)',
          }}>
            {/* embed header */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 14px', borderBottom:'1px solid var(--sunken_bg)',
              background:'var(--page_bg)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background:'var(--accent_primary_hi)', color:'var(--accent_honor_quiet)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="ar" style={{ fontSize: 12, lineHeight: 1 }}>ك</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Cursive</span>
                <span className="mono" style={{ color:'var(--secondary_text)' }}>· letter 5/28</span>
              </div>
              <span className="mono" style={{ color:'var(--secondary_text)' }}>jīm</span>
            </div>

            {/* embed body */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr', gap: 0 }}>
              <div style={{ padding:'18px 16px', borderRight:'1px solid var(--sunken_bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight: 220, position:'relative', background:
                'repeating-linear-gradient(0deg, transparent 0 39px, rgba(91,132,102,.06) 39px 40px)' }}>
                <div className="ar" style={{ fontSize: 140, lineHeight: 1, color:'var(--primary_text)' }}>ج</div>
                <div style={{ marginTop: 12, fontFamily:'var(--f_display)', fontSize: 18, color:'var(--secondary_text)' }}>jīm · /j/</div>
              </div>
              <div style={{ padding:'18px 18px' }}>
                <div className="label-eyebrow">Forms in a word</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: 8, marginTop: 8 }}>
                  {[['isolated','ج'],['initial','جـ'],['medial','ـجـ'],['final','ـج']].map(([n,g],i)=>(
                    <div key={i} style={{
                      background: i===0 ? 'var(--accent_primary_quiet)' : 'var(--page_bg)',
                      border:'1px solid ' + (i===0 ? 'var(--accent_primary_quiet_border)' : 'var(--subtle_stroke)'),
                      borderRadius:'var(--r_2)', padding:'8px 6px', textAlign:'center',
                    }}>
                      <div className="ar" style={{ fontSize: 22, color: i===0 ? 'var(--accent_primary_hi)' : 'var(--primary_text)' }}>{g}</div>
                      <div className="mono" style={{ color:'var(--secondary_text)', marginTop: 4, fontSize: 9 }}>{n}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: 10, background:'var(--page_bg)', borderRadius:'var(--r_2)', fontSize: 12, color:'var(--secondary_text)', lineHeight: 1.5 }}>
                  Hooks below the line. Cousin of <span className="ar">ح</span> and <span className="ar">خ</span> — only the dot changes.
                </div>
                <div style={{ display:'flex', gap: 6, marginTop: 12 }}>
                  <button style={{ flex:1, height: 34, borderRadius:'var(--r_2)', border:'1px solid var(--strong_stroke)', background:'var(--surface_bg)', fontSize: 12, fontWeight: 500, cursor:'pointer' }}>Hear it</button>
                  <button style={{ flex:1, height: 34, borderRadius:'var(--r_2)', border:'1px solid var(--primary_button_border)', background:'var(--accent_primary)', color:'#fff', fontSize: 12, fontWeight: 600, cursor:'pointer' }}>Practice → 2 min</button>
                </div>
              </div>
            </div>

            {/* embed footer */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderTop:'1px solid var(--sunken_bg)', background:'var(--page_bg)' }}>
              <div className="mono" style={{ color:'var(--secondary_text)' }}>via Cursive · MCP</div>
              <div style={{ display:'flex', gap: 6 }}>
                <span className="mono" style={{ color:'var(--secondary_text)' }}>open in app ↗</span>
              </div>
            </div>
          </div>

          {/* follow-up */}
          <div style={{ fontSize: 13, color:'var(--secondary_text)', lineHeight: 1.55, marginTop: 14 }}>
            Want me to queue a 6-card review after this, or jump straight into tracing?
          </div>

          <div style={{ display:'flex', gap: 8, marginTop: 10, flexWrap:'wrap' }}>
            <SuggestChip>Queue review</SuggestChip>
            <SuggestChip>Trace ج</SuggestChip>
            <SuggestChip>Show ح next</SuggestChip>
          </div>
        </div>
      </div>

      {/* composer hint */}
      <div style={{
        position:'absolute', left: 28, right: 28, bottom: 20,
        background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)',
        borderRadius:'var(--r_3)', padding:'10px 14px', fontSize: 13, color:'var(--tertiary_text)',
        display:'flex', alignItems:'center', gap: 10,
      }}>
        <span>Reply to Claude…</span>
        <span style={{ marginLeft:'auto', display:'flex', gap: 6 }}>
          <span className="mono" style={{ background:'var(--sunken_bg)', padding:'2px 6px', borderRadius: 4, color:'var(--secondary_text)' }}>cursive</span>
          <span className="mono" style={{ background:'var(--sunken_bg)', padding:'2px 6px', borderRadius: 4, color:'var(--secondary_text)' }}>+ tools</span>
        </span>
      </div>

    </div>
  </DCArtboard>
);

const SuggestChip = ({ children }) => (
  <div style={{
    fontSize: 12, padding:'6px 12px', borderRadius:'var(--r_pill)',
    background:'var(--surface_bg)', border:'1px solid var(--strong_stroke)',
    color:'var(--secondary_text)', cursor:'pointer',
  }}>{children}</div>
);

// ── Compact MCP variants (small, medium) ─────────────────────
const McpVariants = () => (
  <DCArtboard id="mcp-variants" label="18 · MCP embed sizes" width={760} height={520}>
    <Section kicker="MCP App" title="Three sizes for the chat" padding="32px 32px">

      {/* Small inline */}
      <div className="mono" style={{ color:'var(--secondary_text)', marginBottom: 8 }}>S · inline answer</div>
      <div style={{
        background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)',
        borderRadius:'var(--r_3)', padding:'10px 14px',
        display:'flex', alignItems:'center', gap: 14, maxWidth: 460,
      }}>
        <div className="ar" style={{ fontSize: 36, color:'var(--primary_text)', lineHeight: 1, width: 44, textAlign:'center' }}>ج</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>jīm · /j/</div>
          <div style={{ fontSize: 12, color:'var(--secondary_text)' }}>Hooks below the line · sister of ح, خ</div>
        </div>
        <Btn kind="quiet" size="sm">Practice</Btn>
      </div>

      {/* Medium quiz */}
      <div className="mono" style={{ color:'var(--secondary_text)', margin:'24px 0 8px' }}>M · in-line quiz</div>
      <div style={{
        background:'var(--surface_bg)', border:'1px solid var(--subtle_stroke)',
        borderRadius:'var(--r_3)', padding: 16, maxWidth: 460,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Which one is <i>jīm</i>?</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 8 }}>
          {['ح','خ','ج','چ'].map((l,i)=>(
            <div key={i} className="ar" style={{
              padding:'12px 0', textAlign:'center', fontSize: 28,
              background: i===2 ? 'var(--accent_primary_quiet)' : 'var(--page_bg)',
              border: '1.5px solid ' + (i===2 ? 'var(--accent_primary)' : 'var(--subtle_stroke)'),
              borderRadius:'var(--r_2)', cursor:'pointer',
              color: i===2 ? 'var(--accent_primary_hi)' : 'var(--primary_text)',
            }}>{l}</div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color:'var(--accent_primary_hi)', display:'flex', alignItems:'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l4 4 10-10"/></svg>
          Correct — saved to your deck.
        </div>
      </div>

      <p style={{ fontSize: 12, color:'var(--secondary_text)', marginTop: 22, lineHeight: 1.5, maxWidth: 540 }}>
        Embeds always render in light mode regardless of host theme — the parchment is part of the brand. Maximum height is 480px; anything taller opens in a sheet.
      </p>
    </Section>
  </DCArtboard>
);

Object.assign(window, { McpEmbed, McpVariants });
