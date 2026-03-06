# note.box

A minimal, distraction-free note-taking app. Client-only SPA — no server.

## Stack

- **Nuxt 4** (`ssr: false`) + **Nuxt UI** + **TipTap** editor
- **@nuxtjs/i18n** for internationalization
- **Vitest** + happy-dom for unit tests, **Playwright** for E2E
- **pnpm** as package manager

## Commands

```bash
pnpm dev          # Start dev server
pnpm test         # Run unit + nuxt tests (vitest)
pnpm test:e2e     # Run E2E tests (playwright)
pnpm lint:fix     # Lint and auto-fix
pnpm typecheck    # Type-check
```

## Project Structure

```
app/
  components/     # Vue components (auto-imported)
  composables/    # Composables (auto-imported)
  utils/          # Utility functions (auto-imported)
  types/          # TypeScript types
  layouts/        # Nuxt layouts
  pages/          # Nuxt pages (index, notes/[slug])
  assets/css/     # Global CSS
  error.vue       # Error page
i18n/
  i18n.config.ts  # i18n configuration and translations
test/
  unit/           # Pure logic tests (happy-dom env)
  nuxt/           # Component tests (nuxt env via @nuxt/test-utils)
  e2e/            # E2E tests (Playwright via @nuxt/test-utils/playwright)
```

## Conventions

- Nuxt auto-imports: do NOT manually import `ref`, `computed`, `watch`, `useRoute`, etc.
- Same for `app/` composables and utils — they are auto-imported.
- Types must be explicitly imported (`import type { Note } from '~/types/note'`).
- `useLocalStorage` returns a shared ref per key (cached internally). No singleton boilerplate needed in consumers.
- Prefer real behavior in tests over mocking. Use fake timers for time-dependent tests.
- Tests live in `test/unit/` (pure logic), `test/nuxt/` (components needing Nuxt context), or `test/e2e/` (end-to-end with Playwright).
- Always write tests alongside bug fixes (to cover what wasn't caught) and new features.
- E2E tests: use `force: true` for sidebar buttons (opacity:0 by default), positional selectors for icon-only buttons. Shared helpers live in `test/e2e/helpers.ts`.
