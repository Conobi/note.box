# note.box

A minimal, distraction-free note-taking app. Client-only SPA — no server.

## Stack

- **Nuxt 4** (`ssr: false`) + **Nuxt UI** + **TipTap** editor
- **Vitest** + happy-dom for tests
- **pnpm** as package manager

## Commands

```bash
pnpm dev          # Start dev server
pnpm test         # Run all tests
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
  pages/          # Nuxt pages
  assets/css/     # Global CSS
test/
  unit/           # Pure logic tests (happy-dom env)
  nuxt/           # Component tests (nuxt env via @nuxt/test-utils)
```

## Conventions

- Nuxt auto-imports: do NOT manually import `ref`, `computed`, `watch`, `useRoute`, etc.
- Same for `app/` composables and utils — they are auto-imported.
- Types must be explicitly imported (`import type { Note } from '~/types/note'`).
- `useLocalStorage` returns a shared ref per key (cached internally). No singleton boilerplate needed in consumers.
- Prefer real behavior in tests over mocking. Use fake timers for time-dependent tests.
- Tests live in `test/unit/` (pure logic) or `test/nuxt/` (components needing Nuxt context).
- Always write tests alongside bug fixes (to cover what wasn't caught) and new features.
