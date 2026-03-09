# Mobile Formatting Bar — Design

**Date:** 2026-03-09
**Status:** Approved

## Problem

On Android (and iOS), the OS text-selection toolbar (Copy/Paste/Share) overlaps or hides TipTap's bubble menu when the user selects text. There is no web API to inject items into the OS toolbar.

## Solution

Replace the bubble menu with a **fixed bottom formatting bar** on touch devices. The bar is always visible while the editor is focused and the virtual keyboard is open — eliminating the conflict entirely.

## Behaviour

- **Visible when:** editor is focused on a touch device (`navigator.maxTouchPoints > 0`)
- **Hidden when:** editor loses focus, or on non-touch devices
- **Position:** fixed, anchored just above the virtual keyboard using the `visualViewport` API (already used in `NoteEditor.vue` for scroll-into-view)
- **Desktop:** unchanged — bubble menu (`layout="bubble"`) as today

## Layout

```
[ H1/H2/H3 ▾ ] [ B ] [ I ] [ 🔗 ] [ ··· ]
```

Tapping `···` reveals a **second row** above the first:

```
[ U ] [ S ] [ <> ]
[ H1/H2/H3 ▾ ] [ B ] [ I ] [ 🔗 ] [ ··· ]
```

### Primary row (always shown)
| Slot | Action |
|------|--------|
| Headings picker | Dropdown: H1, H2, H3 (same as bubble) |
| Bold | Toggle bold mark |
| Italic | Toggle italic mark |
| Link | Toggle link |
| `···` | Toggle secondary row |

### Secondary row (toggled)
| Slot | Action |
|------|--------|
| Underline | Toggle underline mark |
| Strikethrough | Toggle strikethrough mark |
| Inline Code | Toggle code mark |

## Components

- **`MobileFormattingBar.vue`** — new component, renders the two-row bar, receives `editor` prop
- **`NoteEditor.vue`** — conditionally renders `MobileFormattingBar` instead of the formatting bubble on touch devices; `UEditorToolbar layout="bubble"` is suppressed on touch

## Out of Scope

- Table toolbar stays as bubble on mobile (table use on mobile is rare)
- No changes to desktop behaviour
- No changes to the slash-command suggestion menu
