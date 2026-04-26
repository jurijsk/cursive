# Cursive

A Nuxt 4 app for studying Arabic letterforms. Type a word, see it shaped by
HarfBuzz into individual SVG glyph paths, click any glyph to get letter or
diacritic information (name, contextual forms, transliteration, dialect-aware
pronunciation, and English example words).

## Stack

- **Nuxt 4** with the `app/` directory (compatibility version 5).
- **HarfBuzz** (`harfbuzzjs` WASM) for text shaping. Loaded once into a
  long-lived singleton on the server (see [server/utils/harfbuzz.ts](server/utils/harfbuzz.ts))
  and reused across requests; clients hit `POST /api/shape` for each text +
  font combination.
- **@nuxt/fonts** for delivering the local TTFs to the browser. The same TTF
  files in `public/fonts/` feed both the server-side shaper and the client-side
  rendering, so text on the page and shaped paths come out of the same source.
- **Pinia** with `pinia-plugin-persistedstate` for user preferences (font
  choice, dialect). State is persisted to `localStorage` and is intended as
  the foundation for future per-user accounts.
- **picocss/pico** for baseline styling.

## How shaping works

1. The user types text. The page calls `POST /api/shape` with the input + the
   currently selected font key.
2. The server normalizes input to NFC, runs HarfBuzz with `liga`/`rlig`/`dlig`
   features **disabled** so words like `الله` and `لا` don't merge into single
   ligature glyphs (each letter renders separately, which is the whole point
   pedagogically). Cursive joining (`init`/`medi`/`fina`/`isol`) still applies
   because those are mandatory script features, not toggleable ligatures.
3. Each shaped glyph comes back with its `cluster` (input character offset),
   `glyphName`, `glyphId`, x/y/xAdvance, and a `missing` flag if the font
   doesn't cover that codepoint.
4. The page renders each glyph as an `<svg><path>`. Glyphs are grouped into
   `<g>` "letter units" so font decompositions (e.g. Tajawal renders ب as a
   dotless body + a separate dot glyph) highlight together. Real diacritics
   (combining marks identified by glyph-name codepoint match against the
   input's mark chars) become their own selectable units.

## Click and navigation

- Each glyph cluster `<g>` highlights as a unit on hover and as a single red
  block when selected — multi-glyph letters (Tajawal's ب, ج, ة etc. that the
  font splits into body + dots) light up together.
- Click a glyph to open the info panel; click the same glyph again to close it.
- The panel surfaces letter info from `content/letters.json`: name, all four
  contextual forms (isolated / initial / medial / final), transliterations,
  and Palestinian / Lebanese pronunciation with English example words.
- The panel's previous/next buttons walk the word in **reading order** —
  letter, then its diacritic(s), then the next letter, and so on — even though
  the SVG itself draws glyphs in HarfBuzz's visual buffer order. The buttons'
  positions follow visual layout: for RTL Arabic, the LEFT button advances
  reading; for LTR text it goes backward. Detection happens by comparing X
  positions of the first two cluster groups.
- Each preview character on a navigation button is wrapped with ZWJ as
  appropriate so it appears in the same contextual form it has in the word
  (e.g. medial miim shows as `‍م‍`).

## Special-spelling helpers

- **NFKC ligature decomposition** — when the input contains a precomposed
  presentation-form ligature (ﷲ, ﷺ, ﷵ, the "Allah ligature" character, etc.),
  a yellow notice offers to decompose it into individual letters with one
  click.
- **Vocalization substitutions** — `app/data/spellings.ts` holds a small table
  of words whose conventional spelling carries diacritics that are usually
  omitted in typing (Allah → اللّٰه; demonstratives هذا, ذلك, …; surah names
  طه, يس). When the bare form is detected, a notice offers to insert the
  diacritics.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The dev server is pinned to `http://localhost:3001/` (see `nuxt.config.ts`).
Routing uses Nuxt's optional dynamic param: `/` and `/<text>` both render the
same page; the URL-encoded text becomes the initial input.

## Tests

```bash
npm run test:unit        # vitest, runs test/unit/*.test.ts
npm run test:e2e         # playwright e2e
```

Unit tests live in `test/unit/`. The cluster-grouping and click-resolution
logic in [app/utils/glyphs.ts](app/utils/glyphs.ts) has dedicated coverage in
`test/unit/glyphs.test.ts`.

## Production

```bash
npm run build
npm run preview
```

## Deploying to Azure Static Web Apps

The build is wired for the Nitro `azure` preset, which targets Azure Static
Web Apps with bundled Functions. Static assets are served from
`.output/public`; the SSR renderer and the `/api/shape` endpoint run as a
single Azure Function under `.output/server`.

### One-time setup

1. **Sign up for Azure** — the Static Web Apps Free tier covers this app.
2. **Push the repo to GitHub** — Azure pulls from there.
3. **Create the Static Web App** in the Azure Portal:
   - Subscription / Resource Group: create new (e.g. `cursive-rg`).
   - Name: `cursive` (or similar).
   - Plan: **Free**.
   - Region: nearest to you.
   - Deployment details: GitHub → authorize → pick the repo and branch.
   - Build presets: **Custom**.
   - App location: `/`
   - Api location: leave blank (Azure's wizard doesn't need it; our workflow
     points at `.output/server`).
   - Output location: `.output/public`
4. **Workflow conflict** — Azure auto-generates its own workflow under
   `.github/workflows/azure-static-web-apps-*.yml` when you connect the repo.
   That conflicts with the one already committed at
   `.github/workflows/azure-static-web-apps.yml`. **Delete Azure's
   auto-generated file** (the one with the random suffix) and keep ours —
   Azure's version re-runs the build inside the deploy action, ours uses the
   pre-built `.output` we produced with `npm ci && npm run build`. Either
   works; ours is faster and explicit.

   Either way, Azure sets the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret on
   the repo automatically — that's what matters. Our workflow reads it via
   `${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}`.
5. **First deploy** needs a manual trigger — see _Triggering a deploy_ below.

### What's deployed where

- `.output/public/` → static SWA assets (HTML stub, `_nuxt/*`, `fonts/*`,
  `hb.wasm`).
- `.output/server/` → Azure Functions app (`host.json`, `package.json`,
  `functions/` with the bundled SSR renderer + `/api/shape` handler).
- `staticwebapp.config.json` at the repo root is **regenerated by Nitro on
  every build** and gitignored. It rewrites `/` and unknown paths to
  `/api/server`, which the catch-all Function handles via the
  `x-ms-original-url` header. The Node version comes from
  `package.json` → `engines.node` (currently `20`).

### Server-asset bundling

The HarfBuzz WASM and the four TTF fonts are bundled into the Function via
Nitro's `serverAssets` (configured in [nuxt.config.ts](nuxt.config.ts)).
At runtime [server/utils/harfbuzz.ts](server/utils/harfbuzz.ts) loads them
through `useStorage('assets:public')` rather than `process.cwd()` — the
function sandbox doesn't have a meaningful cwd. Adding new fonts means
dropping them in `public/fonts/` and updating the `FONTS` table; they get
picked up automatically.

### Node version

`engines.node` in [package.json](package.json) is pinned to `"20"` and
this is intentional. Nitro's `azure-swa` preset reads that field at
build time and writes a matching `apiRuntime: node:20` into the
generated `staticwebapp.config.json`, which tells Azure which runtime
to host the Function on. The preset only recognises the literal
strings `"16"`, `"18"`, and `"20"` (newer values fall back to `"18"`),
so this is the right pin for "latest the toolchain will emit". Azure
SWA supports `node:18` and `node:20` stably today; `node:22` is rolling
out but Nitro at the version we're on won't produce it.

You can develop locally on a newer Node (Node 24, etc.) — npm prints
an `EBADENGINE` warning but the install and build succeed. The pin
exists for the deploy artifact, not to constrain local dev.

### Provisioning the Azure resource

The repo ships a script that creates the resource group and Static Web
App in your Azure subscription, fetches the deploy token, and stores
it as the `AZURE_STATIC_WEB_APPS_API_TOKEN` GitHub secret so the
workflow above can deploy. The SWA is created **without** a GitHub
source so Azure doesn't auto-write a competing workflow file.

Prereqs (one-time, prompt you in a browser):

```powershell
az login
gh auth login
```

Then:

```powershell
# bash version (any *nix or Git Bash)
bash scripts/azure/create-swa.sh --subscription <id-or-name>

# or PowerShell
.\scripts\azure\create-swa.ps1 -Subscription <id-or-name>
```

Optional flags / parameters with defaults: resource group `cursive-rg`,
name `cursive`, location `westeurope`, repo `jurijsk/cursive`. Re-running
is safe — both `az group create` and `az staticwebapp create` are
no-ops if the resource already exists, and the same goes for the DNS
and hostname-binding steps below.

#### Custom domain (optional)

Pass `--hostname` (and `--dns-zone-rg`, the resource group of an Azure
DNS zone in the same subscription) to also wire up a custom subdomain.
The script upserts a CNAME in the parent zone pointing at the SWA's
default hostname and binds the hostname on the SWA via
`cname-delegation` validation:

```powershell
# bash
bash scripts/azure/create-swa.sh --subscription <id-or-name> \
  --hostname cursive.textjoint.com --dns-zone-rg textjoint

# PowerShell
.\scripts\azure\create-swa.ps1 -Subscription <id-or-name> `
  -Hostname cursive.textjoint.com -DnsZoneRg textjoint
```

The zone name is derived from the hostname (everything after the first
dot), so the example above expects a `textjoint.com` DNS zone in the
`textjoint` resource group. Subdomains only — apex domains need
TXT-token validation, which has a different command shape and isn't
handled by the script.

After binding, Azure provisions the TLS cert in the background (usually
a few minutes); the first request can be slow while that happens.

### Triggering a deploy

Deploys are **manual only** (`workflow_dispatch`). Pushing to `master`
does **not** deploy — the assumption is that not every commit should
hit production, so you trigger explicitly when a change is ready:

```powershell
gh workflow run "Azure Static Web Apps CI/CD" --ref master
gh run watch --repo jurijsk/cursive
```

The same trigger is reachable as a "Run workflow" button on the
workflow's page in GitHub if you'd rather use the UI.

The post-deploy smoke test (last step of the workflow) hits `/` and
`/api/shape` on the freshly deployed default hostname and fails the
run if either regresses, so a manual dispatch still gives you that
safety net.

## Project layout

```
app/
  pages/[[text]].vue       # main page (optional dynamic text param)
  data/
    letters.ts             # types + thin re-export of content/letters.json
    spellings.ts           # vocalization substitution table
  stores/settings.ts       # Pinia store (font, dialect) — persisted
  utils/glyphs.ts          # groupGlyphsIntoUnits, resolveGlyphSelection,
                           # letterPreviewInContext (ZWJ-aware), …
content/
  letters.json             # source of truth for letter / diacritic data
public/fonts/              # bundled TTFs — Tajawal, Amiri, Noto Naskh, Reem Kufi
server/
  api/shape.post.ts        # POST endpoint
  utils/harfbuzz.ts        # singleton HarfBuzz + multi-font setup
test/unit/                 # vitest unit tests
tests/                     # playwright e2e specs
```

## Todo

- **Doubled-consonant vocalization** — words like محمد are conventionally
  pronounced with a shadda on the doubled consonant (محمّد) but typed without
  it. Unlike the fixed Allah / dagger-alef cases (handled by
  `app/data/spellings.ts`), this is in principle infinite — any doubled
  consonant could take a shadda. A real implementation would need a
  dictionary-driven full-vocalization step (or an inline shadda-suggestion
  helper for learners), so it's parked until we have a clearer learner-facing
  UX for vocalization.

- **Wire `@nuxt/content` to manage `content/letters.json`** — the data file is
  already in `content/` so it can be served / queried via `@nuxt/content` once
  the module is installed. Today it's imported as a plain JSON module via the
  `~~/content/letters.json` alias from `app/data/letters.ts`. Adopting
  `@nuxt/content` would unlock content-collection queries, an editor UI, and
  per-letter Markdown notes if we want richer descriptions.

- **Mixed-script navigation** — `isRtl` in
  [app/pages/[[text]].vue](app/pages/[[text]].vue) is detected once per page
  state by comparing the first two cluster groups' X positions. For mixed
  text like `Hello مرحبا`, this gives the wrong answer for one of the two
  segments. A robust fix would compute direction per-cluster (using HarfBuzz
  segment properties or Unicode bidi).

- **User accounts and progress tracking** — the Pinia settings store is shaped
  with this in mind (`persist: true` today, server-synced later). Nothing is
  wired up for accounts yet; `font` and `dialect` live in `localStorage` only.

- **Shadda + dagger alef separation in Tajawal** — Tajawal merges
  shadda + dagger alef into a single glyph (`uniFC63`) on the second lam of
  `اللّٰه`. The grouping treats it as a single diacritic unit (the click panel
  picks the first mark — shadda — as the primary). To click each diacritic
  separately on Tajawal we'd need to also disable the relevant `ccmp` rule, or
  switch to a font like Amiri / Noto Naskh that keeps them separate.

- **Letter-click info panel: more letters needed** — the table in
  `content/letters.json` covers all 28 Arabic letters + hamza variants + 9
  diacritics. Letters from extended Arabic-script ranges (Persian, Urdu, etc.)
  aren't covered. When the letter isn't in the table, the panel falls back to
  "No letter information available."

- **`preview_click` reliability on `<svg><path>` elements** — during
  development, programmatic clicks via Playwright didn't always reach Vue's
  `@click` listener on individual SVG path elements. Calling the bound
  `__vnode.props.onClick` directly worked, which suggests the synthetic-click
  pathway has an edge case. Real-user clicks in a browser appear to work
  fine. Worth confirming with a Playwright e2e test on the click → panel
  flow before this becomes load-bearing for CI.
