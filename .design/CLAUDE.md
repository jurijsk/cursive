# CLAUDE.md — Project conventions

Project: **Cursive** — a design system for an Arabic script learning app, embeddable as a Claude MCP chat surface.

This file is auto-loaded for every chat in this project. It captures the conventions you should follow when working on the design system.

---

## Working style

- Use the existing canvas (`Cursive Design System.html`) and JSX parts in `parts/` — don't fork into new files for variations; add a new `<DCArtboard>` or expose changes via the Tweaks panel.
- The Tweaks panel is the right place for any value the user might want to tune (radii, type scale, density). Wire tweaks to CSS custom properties on `document.documentElement`.
- Keep files small. The HTML stays thin (just `:root`, fonts, and script tags); component code lives in `parts/`.

---

## Design System Conventions

How we name color tokens, structure files, and ship a Figma-importable JSON when we build or extend the design system.

### 1 · Two-layer color model

Every color token belongs to one of two layers. **Components only ever reference layer 2.**

#### Layer 1 — Base colors (the palette)

- Named after the **colour, tone & association** — e.g. `oasis_sage`, `parchment_white`, `pomegranate_red`.
- snake_case, all lowercase.
- In CSS, prefixed with **four dashes** (`----`) instead of the usual two. The extra dashes are a visual flag: *do not reference these from a component*.
- They exist only as ingredients used to define semantic colors.

```css
----oasis_sage:        #5b8466;
----parchment_white:   #fbfaf6;
----pomegranate_red:   #a64338;
```

#### Layer 2 — Semantic colors (the API)

- Named after the **function** the color performs — `--primary_button_bg`, `--page_bg`, `--error_field_border`.
- snake_case, standard two-dash CSS custom-property prefix (`--`).
- Always defined as `var(----base_name)` — never as a literal hex.
- Components reference *only* these.

```css
--primary_button_bg:       var(----oasis_sage);
--hover_primary_button_bg: var(----juniper_sage);
--page_bg:                 var(----oat_paper);
```

**Rule of thumb:** if a component's CSS contains a hex code or a `----quad_dash` token, it's wrong. Fix the semantic layer instead.

### 2 · Other token families

Same snake_case rule applies:

- **Radii**: `--r_1`, `--r_2`, `--r_3`, `--r_4`, `--r_5`, `--r_pill`, plus component-specific tokens like `--r_button` when a component should tune independently. Cap container radii at **16px** by default; buttons default to **8px**.
- **Elevation**: `--e_1`, `--e_2`, `--e_3`, `--e_inset`.
- **Spacing**: usually inline px; if tokenized, `--s_1`…`--s_8`.
- **Type families**: `--f_ui`, `--f_display`, `--f_arabic`, `--f_mono`.

No kebab-case anywhere in token names.

### 3 · Files to keep in lockstep

When you add or change tokens, update **all** of:

1. **`Cursive Design System.html`** — the inline `:root { … }` block. This is what the canvas renders against.
2. **`tokens.css`** — canonical exportable copy of the same tokens. Drop-in for the production app.
3. **`cursive-tokens.figma.json`** — Figma-importable JSON (see §4).
4. **Foundations artboard** (`parts/foundations.jsx`) — `ColorPalette` shows base colors with their poetic names; `SemanticTokens` lists semantic → base mappings grouped by function (Surface, Text, Stroke, Primary button, Field, Accent, Status, …).
5. **Tweaks panel** (`parts/app.jsx`) — if a value is user-tunable, expose it and wire it to `document.documentElement.style.setProperty('--r_x', value + 'px')`.

Drift between the three token sources (HTML `:root`, `tokens.css`, Figma JSON) is the #1 source of bugs. Always update all three together.

### 4 · Figma JSON import format

Figma's official Variables Import/Export plugin (from `figma/plugin-samples`) requires a specific shape. The `{ "$type": "color", "$value": "#hex" }` shorthand from W3C Design Tokens **does not work** — base colors must use the full color-object form.

#### Schema (verified working)

```json
{
  "----oasis_sage": {
    "$type": "color",
    "$value": {
      "colorSpace": "srgb",
      "components": [0.357, 0.518, 0.400],
      "alpha": 1,
      "hex": "#5B8466"
    }
  },
  "primary_button_bg": {
    "$type": "color",
    "$value": "{----oasis_sage}"
  }
}
```

- **Base colors**: full object with `colorSpace: "srgb"`, `components: [r, g, b]` as 0–1 floats, `alpha`, `hex` (uppercase).
- **Semantic colors**: alias via `"$value": "{----base_name}"` (curly braces, exact base token name, no `var()` syntax).
- **Order**: each base immediately followed by every semantic token that references it. Diffs stay readable; swapping a base shows obvious downstream impact.
- **Top level**: flat — no `"colors": { … }` wrapper. Nested groups are rejected by the plugin.

#### How to generate

Use a `run_script` block. Helpers:

```js
function hexToComponents(hex) {
  const h = hex.replace('#','');
  return [
    parseInt(h.slice(0,2),16) / 255,
    parseInt(h.slice(2,4),16) / 255,
    parseInt(h.slice(4,6),16) / 255,
  ];
}
const base = (name, hex) => [name, {
  "$type": "color",
  "$value": { "colorSpace":"srgb", "components": hexToComponents(hex), "alpha": 1, "hex": hex.toUpperCase() }
}];
const alias = (name, baseName) => [name, {
  "$type": "color",
  "$value": `{${baseName}}`
}];
```

Then build an array of `[base(...), alias(...), alias(...)]` groups, flatten into an object, write with `JSON.stringify(out, null, 2)`.

#### Importing into Figma

Figma → Plugins → **Variables Import/Export** (from `figma/plugin-samples`) → paste the JSON. If it errors, the most common causes are:

- Using `"$value": "#hex"` shorthand instead of the full color object.
- Nesting under a top-level group like `"colors": {...}`.
- An alias pointing at a name that doesn't exist (typo in `----base_name`).

### 5 · Checklist when extending the system

- [ ] Add base color(s) to `:root` in HTML, `tokens.css`, and `cursive-tokens.figma.json` — same names, same hex.
- [ ] For every new semantic role, define it as `var(----some_base)`.
- [ ] Update `ColorPalette` and `SemanticTokens` artboards in `parts/foundations.jsx`.
- [ ] Confirm no component uses a `----quad_dash` base directly or a literal hex.
- [ ] Re-run the Figma JSON generator script and re-import to verify.
