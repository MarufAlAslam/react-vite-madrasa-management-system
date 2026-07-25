export const DESIGNATIONS = [
  'Assistant Teacher',
  'Senior Assistant Teacher',
  'Lecturer',
  'Assistant Professor',
  'Vice Principal',
  'Principal',
]

export const CLASSES = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Alim 1st Year',
  'Alim 2nd Year',
  'Fazil 1st Year',
  'Fazil 2nd Year',
  'Kamil 1st Year',
  'Kamil 2nd Year',
]

export function getNextClass(currentClass) {
  const index = CLASSES.indexOf(currentClass)
  if (index === -1 || index === CLASSES.length - 1) return null
  return CLASSES[index + 1]
}
