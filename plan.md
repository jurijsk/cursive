## Plan: Client-side per-glyph SVG rendering

TL;DR: Render input `text` as an inline SVG composed of individual glyph `<path>` elements in the browser. Use HarfBuzz WASM for Arabic shaping, `opentype.js` for glyph outlines, `bidi-js` for bidi ordering, and `fontfaceobserver` to ensure `Tajawal-Regular.ttf` is loaded. Keep everything client-only for static hosting; consider Web Worker offloading and caching to mitigate CPU and payload costs.

### Steps
- Install packages: `opentype.js`, `harfbuzzjs`, `bidi-js`, `fontfaceobserver`.
- Add `app/assets/fonts.css` with `@font-face` pointing to `/fonts/Tajawal-Regular.ttf` and import it globally.
- Create `plugins/opentype-harfbuzz.client.ts` to lazy-load and initialize HarfBuzz WASM and `opentype.js`, and provide a `shapeText()` helper.
- Implement `app/components/SvgTextRenderer.vue` that: normalizes `text` (`.normalize('NFC')`), waits for the font, runs bidi segmentation, shapes with `shapeText()`, maps glyph indices to outlines via `opentype.js`, and renders each positioned glyph as an individual `<path>` inside an inline `<svg>`.
- Optionally offload shaping to a Web Worker (`workers/shaper.worker.ts`) and cache shaped results or generated SVGs (IndexedDB/Service Worker) for repeated requests.
- Update `app/pages/[text].vue` to render the component inside `<client-only>` and pass the normalized `text` prop.

### Further Considerations
- HarfBuzz provides glyph indices/positions, not outlines — `opentype.js` (or `fontkit`) is required to extract glyph paths.
- Use `String.prototype.normalize('NFC')` before shaping to handle denormalized input.
- For mixed-direction text, apply logical segmentation, shape per run, then assemble visual runs; `bidi-js` helps with ordering.
- Tradeoffs: shipping HarfBuzz WASM increases client payload; mitigate with lazy-loading, worker offload, caching, or build-time pre-generation for known texts.
- Ensure the Tajawal font includes proper OpenType Arabic GSUB/GPOS tables; without them shaping/ligatures will fail.
