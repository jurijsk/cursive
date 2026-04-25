---
applyTo: "**/*.vue"
---
# Project coding standards for Vue and Nuxt

* This project uses Latest version of Nuxt 4.3.x with the goal to make it compatible with future version Nuxt 5.
* Use nuxt MCP for Nuxt documentation. Alternatively, use https://nuxt.com/llms.txt and for Nuxt v4 Documentation.
Nuxt and Vue uses Single File (SFC) Components where Typescript, HTML and CSS are combined in single file. It means that everything you work with `*.vue` files to have to follow instructions applicable for Typescript [typescript.instructions.md](typescript.instructions.md) CSS [css.instructions.md](css.instructions.md) and [html.instructions.md](html.instructions.md)

## Auto-imports

Nuxt automatically imports Vue Composition API functions, Nuxt composables, components, composables, and utilities—without explicit imports. This improves DX and reduces boilerplate. See the [Nuxt auto-imports docs](https://nuxt.com/docs/4.x/guide/concepts/auto-imports). Only import from third-party packages or when you need to use `#imports` for clarification (rarely needed).

### Do NOT import these (they are auto-imported):

- **Vue Composition API**: `ref`, `reactive`, `computed`, `watch`, `watchEffect`, `isRef`, `unref`, etc.
- **Vue Lifecycle Hooks**: `onMounted`, `onBeforeMount`, `onUnmounted`, `onUpdated`, etc.
- **Nuxt Composables**: `useRoute`, `useRouter`, `useFetch`, `useNuxtData`, `useNuxtApp`, `useRuntimeConfig`, `useState`, `useAsyncData`, etc.
- **Components from `app/components/`**: Automatically available in all templates and scripts.
- **Composables from `app/composables/`**: Automatically available throughout the app.
- **Utilities from `app/utils/`**: Automatically available throughout the app.
