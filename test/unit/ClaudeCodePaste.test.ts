import { describe, it, expect } from 'vitest'
import { isClaudeCodeContent, cleanClaudeCodeContent } from '~/extensions/ClaudeCodePaste'

// Helper: build a Claude Code–style line padded to `width` with 2-space leading indent
function ccLine(content: string, width = 80): string {
  const line = '  ' + content
  return line + ' '.repeat(Math.max(0, width - line.length))
}

describe('isClaudeCodeContent', () => {
  it('detects typical Claude Code output', () => {
    const text = [
      ccLine('Here is some text that was output by Claude Code in the terminal.'),
      ccLine('It has a two-space indent at the start and trailing whitespace.'),
      ccLine('Every single line is padded to the exact same terminal width.'),
      '',
      ccLine('Even after blank lines the pattern continues consistently.'),
    ].join('\n')

    const result = isClaudeCodeContent(text)
    expect(result.detected).toBe(true)
    expect(result.terminalWidth).toBe(80)
  })

  it('rejects normal text without whitespace artifacts', () => {
    const text = 'Hello world\nThis is normal text\nNo trailing spaces here'
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects text with only trailing spaces but no leading indent', () => {
    const text = [
      'No indent here' + ' '.repeat(60),
      'Still no indent' + ' '.repeat(60),
    ].join('\n')
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects text with only leading indent but no trailing spaces', () => {
    const text = '  Indented line\n  Another indented line\n  Third line'
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects very short text (terminal width <= 40)', () => {
    const text = [
      ccLine('Hi', 30),
      ccLine('By', 30),
    ].join('\n')
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects a single non-empty line (< 2 non-empty lines)', () => {
    const text = ccLine('Only one line here')
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('ignores empty lines when computing terminal width', () => {
    const text = [
      ccLine('Line one'),
      '',
      '',
      ccLine('Line two'),
      '',
      ccLine('Line three'),
    ].join('\n')

    const result = isClaudeCodeContent(text)
    expect(result.detected).toBe(true)
    expect(result.terminalWidth).toBe(80)
  })
})

describe('cleanClaudeCodeContent', () => {
  it('strips trailing spaces and 2-space leading indent', () => {
    const text = [
      ccLine('Hello world'),
      ccLine('Second line'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe('Hello world\nSecond line')
  })

  it('rejoins hard-wrapped lines', () => {
    // A line that fills the terminal width was hard-wrapped
    const longSentence = 'This is a long sentence that was wrapped by the terminal because it exceeded the'
    // 'the' would be at position 76 + 2 leading = 78, padded to 80 → original length = 80
    const continuation = 'maximum width of the terminal window.'
    const text = [
      ccLine(longSentence),  // original length = 80 (hits terminal width)
      ccLine(continuation),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe(longSentence + ' ' + continuation)
  })

  it('rejoins three consecutive hard-wrapped lines into one paragraph', () => {
    const part1 = 'A'.repeat(76) // + 2 leading = 78, padded to 80
    const part2 = 'B'.repeat(76)
    const part3 = 'end of paragraph'
    const text = [ccLine(part1), ccLine(part2), ccLine(part3)].join('\n')
    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe(part1 + ' ' + part2 + ' ' + part3)
  })

  it('preserves intentional short lines (not hard-wrapped)', () => {
    const text = [
      ccLine('Short line'),
      ccLine('Another short line'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe('Short line\nAnother short line')
  })

  it('preserves empty lines as paragraph breaks', () => {
    const text = [
      ccLine('Paragraph one'),
      '',
      ccLine('Paragraph two'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe('Paragraph one\n\nParagraph two')
  })

  it('does not join onto markdown structural elements', () => {
    // Even if previous line hits terminal width, don't join onto a heading
    const longLine = 'A'.repeat(76) // + 2 leading = 78, padded to 80
    const text = [
      ccLine(longLine),
      ccLine('# Heading'),
      ccLine('- List item'),
      ccLine('> Blockquote'),
      ccLine('```code fence'),
      ccLine('| table row'),
      ccLine('1. Ordered item'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    const lines = result.split('\n')
    expect(lines[1]).toBe('# Heading')
    expect(lines[2]).toBe('- List item')
    expect(lines[3]).toBe('> Blockquote')
    expect(lines[4]).toBe('```code fence')
    expect(lines[5]).toBe('| table row')
    expect(lines[6]).toBe('1. Ordered item')
  })

  it('does not join onto lines starting with * or + (list markers)', () => {
    const longLine = 'A'.repeat(76)
    const text = [
      ccLine(longLine),
      ccLine('* Star list'),
      ccLine(longLine),
      ccLine('+ Plus list'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    const lines = result.split('\n')
    expect(lines[1]).toBe('* Star list')
    expect(lines[3]).toBe('+ Plus list')
  })
})
