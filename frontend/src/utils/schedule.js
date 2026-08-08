export function formatScheduleDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatScheduleTime(time24) {
  if (!time24) return ''
  const [hour, minute] = time24.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}
