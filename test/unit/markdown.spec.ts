import { describe, expect, it } from 'vitest'
import { jsonContentToMarkdown } from '~/utils/markdown'

describe('jsonContentToMarkdown', () => {
  it('returns empty string for empty doc', () => {
    expect(jsonContentToMarkdown({ type: 'doc' })).toBe('')
    expect(jsonContentToMarkdown({ type: 'doc', content: [] })).toBe('')
  })

  it('converts headings with correct levels', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        { type: 'heading' as const, attrs: { level: 1 }, content: [{ type: 'text' as const, text: 'Title' }] },
        { type: 'heading' as const, attrs: { level: 2 }, content: [{ type: 'text' as const, text: 'Subtitle' }] },
        { type: 'heading' as const, attrs: { level: 3 }, content: [{ type: 'text' as const, text: 'Section' }] },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('# Title\n\n## Subtitle\n\n### Section')
  })

  it('converts paragraphs', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        { type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Hello world' }] },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('Hello world')
  })

  it('applies bold mark', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'bold', marks: [{ type: 'bold' }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('**bold**')
  })

  it('applies italic mark', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'italic', marks: [{ type: 'italic' }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('*italic*')
  })

  it('applies strike mark', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'struck', marks: [{ type: 'strike' }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('~~struck~~')
  })

  it('applies code mark', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'code', marks: [{ type: 'code' }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('`code`')
  })

  it('applies underline mark', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'underlined', marks: [{ type: 'underline' }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('<u>underlined</u>')
  })

  it('converts bullet list', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'bulletList' as const,
          content: [
            { type: 'listItem' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'One' }] }] },
            { type: 'listItem' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Two' }] }] },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('- One\n- Two')
  })

  it('converts ordered list', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'orderedList' as const,
          content: [
            { type: 'listItem' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'First' }] }] },
            { type: 'listItem' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Second' }] }] },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('1. First\n2. Second')
  })

  it('converts blockquote', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'blockquote' as const,
          content: [
            { type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Quoted text' }] },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('> Quoted text')
  })

  it('converts code block', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'codeBlock' as const,
          attrs: { language: 'js' },
          content: [{ type: 'text' as const, text: 'const x = 1' }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('```js\nconst x = 1\n```')
  })

  it('converts horizontal rule', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        { type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Above' }] },
        { type: 'horizontalRule' as const },
        { type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Below' }] },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('Above\n\n---\n\nBelow')
  })

  it('handles nested marks', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'both', marks: [{ type: 'bold' }, { type: 'italic' }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('***both***')
  })

  it('applies highlight mark', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'important', marks: [{ type: 'highlight' }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('==important==')
  })

  it('applies link mark', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'click here', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('[click here](https://example.com)')
  })

  it('converts task list with checked and unchecked items', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'taskList' as const,
          content: [
            { type: 'taskItem' as const, attrs: { checked: false }, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Todo' }] }] },
            { type: 'taskItem' as const, attrs: { checked: true }, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Done' }] }] },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('- [ ] Todo\n- [x] Done')
  })

  it('converts table with header row', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'table' as const,
          content: [
            {
              type: 'tableRow' as const,
              content: [
                { type: 'tableHeader' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Name' }] }] },
                { type: 'tableHeader' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Value' }] }] },
              ],
            },
            {
              type: 'tableRow' as const,
              content: [
                { type: 'tableCell' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'A' }] }] },
                { type: 'tableCell' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: '1' }] }] },
              ],
            },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('| Name | Value |\n| --- | --- |\n| A | 1 |')
  })

  it('converts table with empty cells', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'table' as const,
          content: [
            {
              type: 'tableRow' as const,
              content: [
                { type: 'tableHeader' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Col1' }] }] },
                { type: 'tableHeader' as const, content: [{ type: 'paragraph' as const, content: [] }] },
              ],
            },
            {
              type: 'tableRow' as const,
              content: [
                { type: 'tableCell' as const, content: [{ type: 'paragraph' as const, content: [] }] },
                { type: 'tableCell' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Val' }] }] },
              ],
            },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('| Col1 |  |\n| --- | --- |\n|  | Val |')
  })

  it('converts table with formatted content in cells', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'table' as const,
          content: [
            {
              type: 'tableRow' as const,
              content: [
                { type: 'tableHeader' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Name', marks: [{ type: 'bold' }] }] }] },
              ],
            },
            {
              type: 'tableRow' as const,
              content: [
                { type: 'tableCell' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }] }] },
              ],
            },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('| **Name** |\n| --- |\n| [link](https://example.com) |')
  })

  it('converts table with header row only', () => {
    const doc = {
      type: 'doc' as const,
      content: [
        {
          type: 'table' as const,
          content: [
            {
              type: 'tableRow' as const,
              content: [
                { type: 'tableHeader' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'A' }] }] },
                { type: 'tableHeader' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'B' }] }] },
              ],
            },
          ],
        },
      ],
    }
    expect(jsonContentToMarkdown(doc)).toBe('| A | B |\n| --- | --- |')
  })
})
