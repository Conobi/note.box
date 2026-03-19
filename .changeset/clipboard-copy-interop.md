---
"note.box": minor
---

Add clipboard copy interoperability with external apps

Copied content now pastes cleanly into Google Docs, Microsoft Word, Teams, Confluence, GitHub, and Telegram:
- Tables copy with proper `<thead>`/`<tbody>` structure and inline border styles
- Code blocks include `language-*` class for syntax highlighting in target apps
- Task lists use standard HTML checkboxes
- Plain text slot always contains Markdown

New "Copy format" setting (Settings > Copy format) lets users choose between HTML (default, best for rich-text apps) and Markdown (best for GitHub, Telegram).
