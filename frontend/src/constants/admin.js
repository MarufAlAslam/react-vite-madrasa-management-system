export const DESIGNATIONS = [
  'Assistant Teacher',
  'Senior Assistant Teacher',
  'Lecturer',
  'Assistant Professor',
  'Vice Principal',
  'Principal',
]

export function getNextClass(classNames, currentClass) {
  const index = classNames.indexOf(currentClass)
  if (index === -1 || index === classNames.length - 1) return null
  return classNames[index + 1]
}
