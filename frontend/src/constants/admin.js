export const DESIGNATIONS = [
  'Principal',
  'Vice Principal',
  'Assistant Professor',
  'Lecturer',
  'Senior Assistant Teacher',
  'Assistant Teacher',
]

export const UNIQUE_DESIGNATIONS = ['Principal', 'Vice Principal']

export function sortByDesignation(teachers) {
  return [...teachers].sort((a, b) => DESIGNATIONS.indexOf(a.designation) - DESIGNATIONS.indexOf(b.designation))
}

export function getNextClass(classNames, currentClass) {
  const index = classNames.indexOf(currentClass)
  if (index === -1 || index === classNames.length - 1) return null
  return classNames[index + 1]
}
