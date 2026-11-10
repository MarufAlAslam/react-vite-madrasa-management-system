export const DESIGNATIONS = [
  'Principal',
  'Vice Principal',
  'Assistant Professor',
  'Lecturer',
  'Senior Assistant Teacher',
  'Assistant Teacher',
]

export const GENDERS = ['Male', 'Female']

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const TEACHER_DOCUMENTS = [
  { field: 'ntraCertificate', label: 'NTRA Certificate' },
  { field: 'appointmentLetter', label: 'Appointment Letter' },
  { field: 'joiningLetter', label: 'Joining Letter' },
  { field: 'additionalDocument', label: 'Additional Document' },
]

export const MAX_DOCUMENT_SIZE_MB = 4

export const CLASS_SIX_SECTIONS = ['Ka', 'Kha']

// Only Class 6 is split into sections (Ka / Kha).
export function isClassSix(className) {
  return /(^|\D)6(\D|$)|\bsix\b/i.test(className || '')
}

export const UNIQUE_DESIGNATIONS = ['Principal', 'Vice Principal']

export function sortByDesignation(teachers) {
  return [...teachers].sort((a, b) => DESIGNATIONS.indexOf(a.designation) - DESIGNATIONS.indexOf(b.designation))
}

// Orders students by class (in the order classes are configured), then section, then roll number.
export function sortStudents(students, classNames) {
  const classRank = (className) => {
    const index = classNames.indexOf(className)
    return index === -1 ? classNames.length : index
  }
  const collator = new Intl.Collator(undefined, { numeric: true })

  return [...students].sort(
    (a, b) =>
      classRank(a.className) - classRank(b.className) ||
      collator.compare(a.section || '', b.section || '') ||
      collator.compare(String(a.roll), String(b.roll)),
  )
}

export function getNextClass(classNames, currentClass) {
  const index = classNames.indexOf(currentClass)
  if (index === -1 || index === classNames.length - 1) return null
  return classNames[index + 1]
}
