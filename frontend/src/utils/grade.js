export const GRADE_SCALE = [
  { grade: 'A+', min: 80 },
  { grade: 'A', min: 70 },
  { grade: 'A-', min: 60 },
  { grade: 'B', min: 50 },
  { grade: 'C', min: 40 },
  { grade: 'D', min: 33 },
]

export function computeGrade(marks, fullMarks) {
  const percentage = (Number(marks) / Number(fullMarks)) * 100
  if (!Number.isFinite(percentage)) return ''

  const match = GRADE_SCALE.find((entry) => percentage >= entry.min)
  return match ? match.grade : 'F'
}
