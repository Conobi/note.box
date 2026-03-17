import { describe, expect, it } from 'vitest'
import { CodeMarkFix } from '~/extensions/CodeMarkFix'

describe('CodeMarkFix', () => {
  it('is a TipTap extension with name "codeMarkFix"', () => {
    expect(CodeMarkFix.name).toBe('codeMarkFix')
  })

  it('defines keyboard shortcuts for Enter and Backspace', () => {
    expect(CodeMarkFix.config.addKeyboardShortcuts).toBeDefined()
  })
})
