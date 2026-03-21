# note.box

## 0.5.0

### Minor Changes

- 6a14ee4: Add Claude Code paste cleanup: automatically detects pasted content from Claude Code, removes line numbers and formatting artifacts, and offers an undo toast

## 0.4.0

### Minor Changes

- 6464925: Add clipboard copy interoperability with external apps

  Copied content now pastes cleanly into Google Docs, Microsoft Word, Teams, Confluence, GitHub, and Telegram:

  - Tables copy with proper `<thead>`/`<tbody>` structure and inline border styles
  - Code blocks include `language-*` class for syntax highlighting in target apps
  - Task lists use standard HTML checkboxes
  - Plain text slot always contains Markdown

  New "Copy format" setting (Settings > Copy format) lets users choose between HTML (default, best for rich-text apps) and Markdown (best for GitHub, Telegram).

## 0.3.0

### Minor Changes

- 276dc77: Add mobile formatting bar: replaces the bubble toolbar with a fixed bottom bar on touch devices. The bar stays visible while the virtual keyboard is open, with primary actions (headings, bold, italic, link) and a toggle for secondary formatting (underline, strikethrough, code).

## 0.2.0

### Minor Changes

- 3724d5b: Add mobile touch gestures, safe areas, and UI/UX improvements

  - Swipe gestures on mobile for sidebar navigation
  - Safe area insets support for notched devices
  - Ctrl+Alt+N keyboard shortcut for new note (Chrome/Edge/Safari)
  - Fix editor placeholder visibility when document has content
  - Fix selection highlight on empty paragraphs in editor
  - Self-hosted fonts via @fontsource packages

## 0.1.0

### Minor Changes

- 7719072: Initial release of note.box — a minimal, distraction-free note-taking app.

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
