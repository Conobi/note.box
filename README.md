<p align="center">
  <a href="https://note.box">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="public/logo-light.svg">
      <img alt="note.box" src="public/logo-light.svg" height="48">
    </picture>
  </a>
</p>

<p align="center">
  A minimal, distraction-free note-taking app. Client-only SPA — no server, no account.
</p>

<p align="center">
  <a href="https://github.com/Conobi/note.box/actions/workflows/deploy.yml"><img src="https://github.com/Conobi/note.box/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <a href="https://github.com/Conobi/note.box/releases/latest"><img src="https://img.shields.io/github/v/release/Conobi/note.box" alt="Release"></a>
  <a href="https://github.com/Conobi/note.box/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Conobi/note.box" alt="License"></a>
</p>

---

## Features

- Rich-text editor powered by TipTap — tables, task lists, highlights
- Zen monochrome theme with 7 curated font choices
- Notes stored in your browser via localStorage — nothing leaves your device
- Responsive layout with collapsible sidebar
- Keyboard shortcuts for everything
- 9 languages supported
- Installable as a PWA

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm generate     # Generate static site
pnpm test         # Run unit + component tests
pnpm test:e2e     # Run E2E tests (Playwright)
pnpm lint:fix     # Lint and auto-fix
pnpm typecheck    # Type-check
```

## Stack

- [Nuxt 4](https://nuxt.com) (SSR disabled, static SPA)
- [Nuxt UI](https://ui.nuxt.com) + [Tailwind CSS](https://tailwindcss.com)
- [TipTap](https://tiptap.dev) rich-text editor
- [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) for testing
- Deployed to [Cloudflare Pages](https://pages.cloudflare.com)

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[AGPL-3.0](LICENSE)
