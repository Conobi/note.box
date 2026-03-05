import { describe, it, expect } from 'vitest'
import { formatSmartDate } from '~/utils/formatSmartDate'

describe('formatSmartDate', () => {
  // Thursday March 5, 2026 at 3:00 PM
  const now = new Date(2026, 2, 5, 15, 0, 0)

  it('shows time for today', () => {
    const today = new Date(2026, 2, 5, 9, 30, 0).toISOString()
    const result = formatSmartDate(today, now)
    // Should contain the minutes portion regardless of locale
    expect(result).toMatch(/30/)
  })

  it('shows "Yesterday" for yesterday', () => {
    const yesterday = new Date(2026, 2, 4, 18, 0, 0).toISOString()
    expect(formatSmartDate(yesterday, now)).toBe('Yesterday')
  })

  it('shows weekday name for earlier this week', () => {
    // March 5 2026 is a Thursday, so Monday (March 2) is in the same week
    const monday = new Date(2026, 2, 2, 12, 0, 0).toISOString()
    const result = formatSmartDate(monday, now)
    // Should be the locale's full weekday name (Monday, lundi, etc.)
    // Verify it's not a date with numbers (which would mean it fell through to another branch)
    expect(result).not.toMatch(/\d/)
  })

  it('shows month and day for earlier this year', () => {
    const earlier = new Date(2026, 0, 15, 10, 0, 0).toISOString()
    const result = formatSmartDate(earlier, now)
    expect(result).toMatch(/15/)
    // Should NOT contain the year
    expect(result).not.toMatch(/2026/)
  })

  it('shows month, day, and year for previous years', () => {
    const lastYear = new Date(2025, 5, 20, 10, 0, 0).toISOString()
    const result = formatSmartDate(lastYear, now)
    expect(result).toMatch(/20/)
    expect(result).toMatch(/2025/)
  })

  it('shows time for midnight today', () => {
    const midnight = new Date(2026, 2, 5, 0, 0, 0).toISOString()
    const result = formatSmartDate(midnight, now)
    // Should be a time format, containing ":" for hours:minutes
    expect(result).toMatch(/:/)
  })

  it('shows "Yesterday" for just before midnight', () => {
    const lateYesterday = new Date(2026, 2, 4, 23, 59, 59).toISOString()
    expect(formatSmartDate(lateYesterday, now)).toBe('Yesterday')
  })

  it('treats last week Saturday as a date, not a weekday', () => {
    // Feb 28 2026 is a Saturday, before the current week starting Sunday March 1
    const lastSaturday = new Date(2026, 1, 28, 12, 0, 0).toISOString()
    const result = formatSmartDate(lastSaturday, now)
    // Should show month + day format, containing "28"
    expect(result).toMatch(/28/)
  })

  it('uses custom yesterday label', () => {
    const yesterday = new Date(2026, 2, 4, 18, 0, 0).toISOString()
    expect(formatSmartDate(yesterday, now, { yesterdayLabel: 'Hier' })).toBe('Hier')
  })

  it('uses locale for date formatting', () => {
    const earlier = new Date(2026, 0, 15, 10, 0, 0).toISOString()
    const result = formatSmartDate(earlier, now, { locale: 'fr' })
    expect(result).toMatch(/15/)
  })
})
