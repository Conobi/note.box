---
"note.box": minor
---

Initial release of note.box — a minimal, distraction-free note-taking app.

### Features

- TipTap rich-text editor with bubble toolbar and H1 title placeholder
- Complete table support with resize, context menu, gutter select, and keyboard shortcuts
- Task list support with input rules (`[ ]`, `[x]`)
- Sidebar with note list, smart relative dates, slug-based URLs, and title tooltips
- Responsive layout with collapsible sidebar for mobile/tablet
- Persistent zen sidebar with monochrome theme
- Settings modal with 7 curated Google Fonts, color scheme picker, and note export
- Internationalization (i18n) with 9 languages
- Keyboard shortcuts for all major actions (Ctrl+N, Ctrl+K, Ctrl+,) including Firefox support
- Error page, SPA loader, and page transitions
- Logo branding assets, sidebar logo, and dark-mode favicon
- CI/CD pipeline with GitHub Actions, Changesets, and Cloudflare Pages deployment

### Performance

- Eliminate editor typing jank from cascading reactivity chain
- Deduplicating refs to prevent accumulated trigger calls during rapid input
- Optimized getJSON stub to avoid per-keystroke tree walks

### Bug Fixes

- Stable editor width on small/intermediate viewports
- Prevent editor content loss on slug change during typing
- Global shortcuts work inside TipTap editor
- Browser language detection on first load
- Editor placeholder only shown on focused empty paragraph
- Empty string sentinel for untitled notes instead of hardcoded English
