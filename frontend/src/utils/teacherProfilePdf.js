import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { drawProfileHeader, imageUrlToCoverDataUrl, THEME } from './pdf'
import { teacherDetails } from './teacher'

export async function downloadTeacherProfilePdf(teacher) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  let photoDataUrl = null
  try {
    photoDataUrl = await imageUrlToCoverDataUrl(teacher.photoUrl, 300, 300)
  } catch {
    photoDataUrl = null
  }

  const startY = drawProfileHeader(doc, {
    title: 'Teacher Profile',
    photoDataUrl,
    lines: [teacher.name, teacher.designation],
  })

  autoTable(doc, {
    startY: Math.max(startY, 56),
    body: teacherDetails(teacher, { includeNid: true }),
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: THEME.paperTint } },
    styles: { textColor: THEME.ink, lineColor: THEME.gold, lineWidth: 0.2 },
  })

  doc.save(`teacher-profile-${teacher.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
