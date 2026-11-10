export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Ordered label/value pairs shown on cards, profile and PDF. NID is only included for admins.
export function teacherDetails(teacher, { includeNid = false } = {}) {
  const details = [
    ['Designation', teacher.designation],
    ['Subject Taught', teacher.subject],
    ['Qualification', teacher.qualification],
    ['Joining Date', formatDate(teacher.joiningDate)],
    ['Gender', teacher.gender],
    ['Blood Group', teacher.bloodGroup],
    ['Index No.', teacher.indexNo],
    ['Phone', teacher.phone],
    ['Address', teacher.address],
  ]
  if (includeNid) details.push(['NID Number', teacher.nid])

  return details.map(([label, value]) => [label, value || '-'])
}
