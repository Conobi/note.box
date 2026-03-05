interface FormatSmartDateOptions {
  yesterdayLabel?: string
  locale?: string
}

export function formatSmartDate(isoString: string, now: Date = new Date(), options: FormatSmartDateOptions = {}): string {
  const { yesterdayLabel = 'Yesterday', locale } = options
  const date = new Date(isoString)

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay())

  if (date >= startOfToday) {
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  }

  if (date >= startOfYesterday) {
    return yesterdayLabel
  }

  if (date >= startOfWeek) {
    return date.toLocaleDateString(locale, { weekday: 'long' })
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }

  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}
