# Translation Guidelines

## Character Budgets

Some keys appear in space-constrained containers (sidebar, buttons, tooltips). Translations for these keys **must** stay within the character limit:

| Key | Max Chars | Container |
|-----|----------:|-----------|
| `noteList.searchPlaceholder` | 18 | Sidebar search input (220px minus icon and shortcut badges) |
| `app.newNote` | 16 | Tooltip / mobile button |
| `app.settings` | 14 | Tooltip / sidebar button |
| `app.openMenu` | 16 | Mobile menu button |
| `settings.light` | 10 | Theme toggle (2-column grid) |
| `settings.dark` | 10 | Theme toggle (2-column grid) |
| `emptyState.newNote` | 16 | CTA button label |
| `noteListItem.deleteNote` | 20 | Tooltip on small button |
| `settings.exportAll` | 30 | Block button in settings modal |

## Rules

- If a translation exceeds the budget, **abbreviate or rephrase** rather than using the full literal translation.
- For CJK languages (zh, ja, ko), each character renders approximately 2× the width of a Latin character.
- The unit test `test/unit/i18n-expansion.spec.ts` enforces these budgets automatically — `pnpm test` will fail if a budget is violated.
- E2E overflow tests in `test/e2e/i18n-overflow.e2e.ts` verify that translations don't visually overflow their containers.

## Verification

1. Run `pnpm test` to check character budgets
2. Switch locale in the running app (`pnpm dev`) and visually inspect the sidebar and settings modal
