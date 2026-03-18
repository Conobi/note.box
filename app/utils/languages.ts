export interface Language {
  name: string
  alias: string
}

export const LANGUAGES: Language[] = [
  { name: 'Bash', alias: 'bash' },
  { name: 'C', alias: 'c' },
  { name: 'C++', alias: 'cpp' },
  { name: 'C#', alias: 'csharp' },
  { name: 'CSS', alias: 'css' },
  { name: 'Dart', alias: 'dart' },
  { name: 'Diff', alias: 'diff' },
  { name: 'Dockerfile', alias: 'dockerfile' },
  { name: 'Elixir', alias: 'elixir' },
  { name: 'Go', alias: 'go' },
  { name: 'GraphQL', alias: 'graphql' },
  { name: 'HTML', alias: 'html' },
  { name: 'Java', alias: 'java' },
  { name: 'JavaScript', alias: 'js' },
  { name: 'JSON', alias: 'json' },
  { name: 'JSX', alias: 'jsx' },
  { name: 'Kotlin', alias: 'kotlin' },
  { name: 'Lua', alias: 'lua' },
  { name: 'Markdown', alias: 'markdown' },
  { name: 'PHP', alias: 'php' },
  { name: 'Python', alias: 'py' },
  { name: 'Ruby', alias: 'ruby' },
  { name: 'Rust', alias: 'rust' },
  { name: 'SCSS', alias: 'scss' },
  { name: 'Shell', alias: 'shell' },
  { name: 'SQL', alias: 'sql' },
  { name: 'Swift', alias: 'swift' },
  { name: 'TOML', alias: 'toml' },
  { name: 'TSX', alias: 'tsx' },
  { name: 'TypeScript', alias: 'ts' },
  { name: 'Vue', alias: 'vue' },
  { name: 'XML', alias: 'xml' },
  { name: 'YAML', alias: 'yaml' },
]

// Build a lookup: alias or lowercase name → display name
const displayNameLookup = new Map<string, string>()
for (const lang of LANGUAGES) {
  displayNameLookup.set(lang.alias, lang.name)
  displayNameLookup.set(lang.name.toLowerCase(), lang.name)
}

/** Get the display name for a language identifier.
 *  e.g. "py" → "Python", "javascript" → "JavaScript", "ts" → "TypeScript" */
export function languageDisplayName(input: string): string {
  return displayNameLookup.get(input.toLowerCase()) ?? input
}

export function filterLanguages(query: string): Language[] {
  if (!query) return LANGUAGES
  const q = query.toLowerCase()
  return LANGUAGES.filter(
    l => l.name.toLowerCase().includes(q) || l.alias.includes(q),
  )
}
