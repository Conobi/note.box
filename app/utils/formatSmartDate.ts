export function formatSmartDate(isoString: string, now: Date = new Date()): string {
  const date = new Date(isoString)

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay())

  if (date >= startOfToday) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  if (date >= startOfYesterday) {
    return 'Yesterday'
  }

  if (date >= startOfWeek) {
    return date.toLocaleDateString(undefined, { weekday: 'long' })
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
