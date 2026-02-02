# Copilot / AI Agent Instructions for this repo

This is a small Nuxt 4 single-page portfolio site (static target). Keep guidance compact and specific to discovered patterns.

- **Big picture:** Nuxt 4 app using `@nuxtjs/i18n`, `@nuxt/content`, `nuxt-studio` and `@nuxt/fonts`. The repo is structured under `app/` (pages, components) and translations live in `i18n/locales/*.json`.
- **Primary intent:** single-page, multilingual static site (host on GitHub Pages). Prefer static generation via `npm run generate` unless asked to change hosting model.

- **Key files / locations:**
  - `nuxt.config.ts` — module list, `i18n` configuration and compatibility/experimental flags.
  - `package.json` — scripts: `dev`, `build`, `generate`, `preview`, `postinstall` (`nuxt prepare`). Use these scripts for local workflows.
  - `app/` — entry: `app/app.vue`, pages in `app/pages`, components in `app/components`.
  - `i18n/locales/` — locale JSON files (e.g. `en.json`, `de.json`, `da.json`). `nuxt.config.ts` lists locales and `file` names.
  - `public/` — static assets and `robots.txt`.

- **Developer workflows (explicit):**
  - Start dev server: `npm run dev` (hot reload + devtools enabled in config).
  - Build for production: `npm run build`.
  - Generate static site: `npm run generate` — use this when preparing artifacts for GitHub Pages.
  - Preview generated site: `npm run preview`.

- **i18n convention:**
  - Translation files are simple JSON files under `i18n/locales/` and referenced in `nuxt.config.ts` by `file` name. When adding a locale: add the JSON file and add an entry to the `locales` array in `nuxt.config.ts`.
  - Example: the repository already contains `i18n/locales/en.json` and `nuxt.config.ts` sets `defaultLocale: 'en'`.

- **Content & editing:**
  - `@nuxt/content` is installed — content should go under a `content/` directory when used. `nuxt-studio` is present for live editing; respect its conventions if used.
  - Do not introduce new content backends without justification; prefer using existing modules.

- **Patterns & small examples:**
  - Pages are single-file Vue components in `app/pages/*.vue` (e.g. `app/pages/index.vue`). Components live in `app/components` (e.g. `AppAlert.vue`). Keep components small and focused.
  - Global shell and routing are via `app/app.vue` using `<NuxtPage />`.
  - Auto-imports: Components placed in `components/` (project root) are auto-imported by Nuxt/Vue — do not add explicit `import` statements for those. If you add components under `app/components/`, either import them explicitly or configure `nuxt.config.ts` to include that folder for auto-imports.

**Commenting guideline for AI agents:**
- Avoid adding comments that merely restate what the code already shows (e.g., "// imports Header component" next to an import). Do not add comments that are obvious from reading the code or are standard framework behaviors documented by Nuxt/Vue. Add comments only when they provide value: rationale, non-obvious implementation notes, or references to external design tokens or Figma frame IDs.

- **Nuxt config notes:**
  - Keep `compatibilityDate` and `future.experimental` settings intact unless there is a clear migration reason.
  - Devtools are enabled in the config to assist local debugging — safe to use.

- **Styling:**
  - Use modern, plain CSS for all styling. Do not add CSS frameworks (Tailwind, Bootstrap, etc.) unless you have explicit approval.
  - Prefer component-scoped `<style>` blocks in files under `app/components` and place global styles in `app/assets` or `app/styles`.
  - Follow simple, maintainable conventions (CSS variables, logical class names). The README and Figma designs are the ground truth for visual decisions.
  - CSS custom properties: use underscores to separate words (example: `--custom_property`). Always keep the leading `--` when declaring variables.
  - **CSS class naming:** Do not use BEM-style `parent__child` naming. Instead, use CSS nesting to scope styles and choose semantic class names that describe what the element *is* or *does*, not its location in the DOM hierarchy. Example: use `.hero { .headline { ... } }` instead of `.hero__headline { ... }`.

- **Responsive design:**
  - **Fluid typography:** The base font size (`----type_ramp_base`) uses `clamp()` to scale smoothly from 16px at 375px viewport to 22px at 2000px+. All `rem`-based sizes scale automatically.
  - **Container queries:** Use `@container page (max-width: Xrem)` for layout changes instead of viewport-based `@media` queries. This responds to content width (max 2000px) rather than screen size.
  - **Fallback pattern:** Always include a fallback for older browsers:
    ```css
    @container page (max-width: 50rem) { /* modern browsers */ }
    @supports not (container-type: inline-size) {
      @media (max-width: 900px) { /* fallback */ }
    }
    ```
  - **Full-bleed sections:** Sections always span full viewport width (for backgrounds). Inside, use `.content` wrapper to constrain content:
    ```html
    <section class="my_section">
      <div class="content">
        <!-- content constrained to max-width -->
      </div>
    </section>
    ```
    For special cases like Hero (two columns with different backgrounds), handle layout directly in the section without `.content`.
  - **Fluid spacing:** `--page_side_spacing` and `--section_block_spacing` also use `clamp()` for proportional margins.

- **When an AI agent should modify code:**
  - If adding a locale: update `i18n/locales/<code>.json` and add the locale entry in `nuxt.config.ts`.
  - If adding pages/components: place them under `app/pages` or `app/components` respectively and avoid changing global layout unless requested.
  - If adding new npm packages: require an explicit justification in the git message; prefer existing modules.

- **Do not assume:**
  - No test harness was found — avoid creating tests without asking the repo owner.

If anything is unclear or you want more detail about a specific area (i18n, content, deploy steps), tell me which section to expand.
