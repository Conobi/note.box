# note.box

A minimal, distraction-free note-taking app. Client-only SPA — no server.

## Stack

- **Nuxt 4** (`ssr: false`) + **Nuxt UI** + **TipTap** editor
- **@nuxtjs/i18n** for internationalization
- **Vitest** + happy-dom for unit tests, **Playwright** for E2E
- **vue-tsc** as a devDependency (so `nuxi typecheck` uses the local install)
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
  assets/         # SVG logos and branding (branding.html for reference)
  error.vue       # Error page
i18n/
  i18n.config.ts  # i18n configuration and translations
test/
  unit/           # Pure logic tests (happy-dom env)
  nuxt/           # Component tests (nuxt env via @nuxt/test-utils)
  e2e/            # E2E tests (Playwright via @nuxt/test-utils/playwright)
public/
  favicon.svg     # Favicon with light/dark mode support
  logo-light.svg  # README logo (light theme)
  logo-dark.svg   # README logo (dark theme)
```

## CI/CD

- **CI** (`ci.yml`): lint, typecheck, test — runs on every push via workflow_call
- **Deploy** (`deploy.yml`): CI + `pnpm generate` + Cloudflare Pages deploy
  - `"Version Packages"` commit → **production** (`branch=main`)
  - Other commits on `main` → **staging** (`branch=staging`)
  - Pull requests → **preview** (branch = PR name)
- **Release** (`release.yml`): Changesets → "Version Packages" PR → GitHub Release on merge

### Versioning with Changesets

```bash
pnpm changeset                    # Create a changeset describing your changes
git add . && git commit && git push  # Push to main
# → Release workflow opens "Version Packages" PR
# → Merge that PR → production deploy + GitHub Release
```

## Conventions

- Nuxt auto-imports: do NOT manually import `ref`, `computed`, `watch`, `useRoute`, etc.
- Same for `app/` composables and utils — they are auto-imported.
- Types must be explicitly imported (`import type { Note } from '~/types/note'`).
- `useLocalStorage` returns a shared ref per key (cached internally). No singleton boilerplate needed in consumers.
- Prefer real behavior in tests over mocking. Use fake timers for time-dependent tests.
- Tests live in `test/unit/` (pure logic), `test/nuxt/` (components needing Nuxt context), or `test/e2e/` (end-to-end with Playwright).
- Always write tests alongside bug fixes (to cover what wasn't caught) and new features.
- Always run `pnpm lint`, `pnpm typecheck`, and `pnpm test` locally before committing.
- E2E tests: use `force: true` for sidebar buttons (opacity:0 by default), positional selectors for icon-only buttons. Shared helpers live in `test/e2e/helpers.ts`.
