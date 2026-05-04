// app.jsx — assembles the design canvas + Tweaks panel for radii.

const { DesignCanvas, DCSection, TweaksPanel, useTweaks, TweakSection, TweakSlider, TweakButton } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "r1": 4,
  "r2": 8,
  "r3": 12,
  "r4": 16,
  "r5": 16,
  "rButton": 8
}/*EDITMODE-END*/;

function applyRadii(t) {
  const r = document.documentElement;
  r.style.setProperty('--r_1', t.r1 + 'px');
  r.style.setProperty('--r_2', t.r2 + 'px');
  r.style.setProperty('--r_3', t.r3 + 'px');
  r.style.setProperty('--r_4', t.r4 + 'px');
  r.style.setProperty('--r_5', t.r5 + 'px');
  r.style.setProperty('--r_button', t.rButton + 'px');
  // Nudge components that read radii at render time (foundations radius display).
  window.postMessage({ type: '__tweaks_radius_changed' }, '*');
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyRadii(t); }, [t.r1, t.r2, t.r3, t.r4, t.r5, t.rButton]);

  const reset = () => {
    setTweak({ r1: 4, r2: 8, r3: 12, r4: 16, r5: 16, rButton: 8 });
  };

  return (
    <React.Fragment>
      <DesignCanvas>
        <DCSection id="overview" title="Cursive" subtitle="A design system for adults learning to read Arabic — embeddable in Claude.">
          {Cover()}
        </DCSection>

        <DCSection id="foundations" title="Foundations" subtitle="Color, type, spacing, motion, imagery">
          {ColorPalette()}
          {SemanticTokens()}
          {TypePairing()}
          {SpacingRadiusElevation()}
          {Iconography()}
          {Motion()}
          {Illustration()}
        </DCSection>

        <DCSection id="components" title="Core components" subtitle="Buttons, inputs, cards, badges, tabs, toasts">
          {Buttons()}
          {Inputs()}
          {ComponentsExtras()}
        </DCSection>

        <DCSection id="learning" title="Learning components" subtitle="The pieces unique to teaching Arabic script">
          {LetterCard()}
          {Flashcard()}
          {ProgressBits()}
          {LessonTile()}
          {TraceAndListen()}
        </DCSection>

        <DCSection id="screens" title="Sample screen" subtitle="The system in use">
          {HomeScreen()}
        </DCSection>

        <DCSection id="mcp" title="MCP App embed" subtitle="How Cursive lives inside a Claude conversation">
          {McpEmbed()}
          {McpVariants()}
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks · Radii">
        <TweakSection label="Container radii" />
        <TweakSlider label="r-1 · hairline" value={t.r1} min={0} max={16} step={1} unit="px"
                     onChange={(v) => setTweak('r1', v)} />
        <TweakSlider label="r-2 · default" value={t.r2} min={0} max={16} step={1} unit="px"
                     onChange={(v) => setTweak('r2', v)} />
        <TweakSlider label="r-3 · cards & inputs" value={t.r3} min={0} max={16} step={1} unit="px"
                     onChange={(v) => setTweak('r3', v)} />
        <TweakSlider label="r-4 · feature cards" value={t.r4} min={0} max={16} step={1} unit="px"
                     onChange={(v) => setTweak('r4', v)} />
        <TweakSlider label="r-5 · hero" value={t.r5} min={0} max={16} step={1} unit="px"
                     onChange={(v) => setTweak('r5', v)} />

        <TweakSection label="Component-specific" />
        <TweakSlider label="Buttons" value={t.rButton} min={0} max={16} step={1} unit="px"
                     onChange={(v) => setTweak('rButton', v)} />

        <div style={{ marginTop: 6 }}>
          <TweakButton onClick={reset}>Reset to defaults</TweakButton>
        </div>

        <div style={{
          marginTop: 10, padding: '8px 10px', borderRadius: 6,
          background: 'rgba(91,132,102,.10)', color: '#34503e',
          fontSize: 11, lineHeight: 1.45,
        }}>
          Capped at 16px — radii larger than that read as “bubbly,” not crafted.
          Buttons stay tight at 8px to feel decisive.
        </div>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
