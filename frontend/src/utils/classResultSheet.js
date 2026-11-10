import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { computeGPA } from './grade'
import { THEME, drawDoubleBorder } from './pdf'

export function ordinal(n) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`
}

// One row per student in the class. Students are ranked by total marks (GPA breaks no ties:
// equal totals share a merit position). Students without results for the exam go last, unranked.
export function buildClassResultRows({ students, results, examName }) {
  const rows = students.map((student) => {
    const entries = results.filter((result) => result.studentId === student.id && result.examName === examName)
    const marksBySubject = Object.fromEntries(entries.map((entry) => [entry.subject, entry.marks]))
    const total = entries.reduce((sum, entry) => sum + Number(entry.marks), 0)
    const gpa = entries.length ? computeGPA(entries.map((entry) => entry.grade)) : null
    return { student, marksBySubject, total, gpa, hasResult: entries.length > 0, position: null }
  })

  const ranked = rows.filter((row) => row.hasResult).sort((a, b) => b.total - a.total || Number(a.student.roll) - Number(b.student.roll))
  ranked.forEach((row, index) => {
    row.position = index > 0 && row.total === ranked[index - 1].total ? ranked[index - 1].position : index + 1
  })

  const unranked = rows.filter((row) => !row.hasResult).sort((a, b) => Number(a.student.roll) - Number(b.student.roll))
  return [...ranked, ...unranked]
}

const SUBJECT_COLUMN_START = 3
const SUBJECT_COLUMN_WIDTH = 10
const HEAD_PADDING = 4

export function subjectHeading(subject) {
  return subject.labelEn || subject.name
}

export function buildClassResultPdf({ madrasaName, className, examName, subjects, rows }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const pageWidth = doc.internal.pageSize.getWidth()

  drawDoubleBorder(doc, 10, 8, pageWidth - 20, 26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...THEME.green)
  doc.setFontSize(16)
  doc.text(madrasaName, pageWidth / 2, 18, { align: 'center' })
  doc.setFontSize(11)
  doc.text(`Class Result Sheet — ${className} — ${examName}`, pageWidth / 2, 27, { align: 'center' })

  // Subject names are drawn rotated (jspdf-autotable can't rotate text), so size the header row to the longest one.
  doc.setFontSize(8)
  const headHeight = Math.max(
    12,
    ...subjects.map((subject) => doc.getTextWidth(subjectHeading(subject)) + HEAD_PADDING),
  )

  const totalFullMarks = subjects.reduce((sum, subject) => sum + Number(subject.fullMarks || 0), 0)

  autoTable(doc, {
    startY: 38,
    theme: 'grid',
    margin: { left: 10, right: 10 },
    head: [
      [
        'Merit',
        'Roll',
        'Name',
        ...subjects.map(() => ''),
        `Total\n(${totalFullMarks})`,
        'GPA',
      ],
    ],
    body: rows.map((row) => [
      row.position ? ordinal(row.position) : '-',
      row.student.roll,
      row.student.name,
      ...subjects.map((subject) => row.marksBySubject[subject.name] ?? '-'),
      row.hasResult ? row.total : '-',
      row.gpa === null ? '-' : row.gpa.toFixed(2),
    ]),
    headStyles: { fillColor: THEME.green, textColor: 255, halign: 'left', valign: 'bottom', fontSize: 8, minCellHeight: headHeight },
    alternateRowStyles: { fillColor: THEME.paperTint },
    styles: { textColor: THEME.ink, lineColor: THEME.gold, lineWidth: 0.2, fontSize: 8, halign: 'left' },
    columnStyles: {
      ...Object.fromEntries(subjects.map((_, index) => [SUBJECT_COLUMN_START + index, { cellWidth: SUBJECT_COLUMN_WIDTH }])),
    },
    didDrawCell(data) {
      const index = data.column.index - SUBJECT_COLUMN_START
      if (data.section !== 'head' || index < 0 || index >= subjects.length) return

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255)
      doc.text(subjectHeading(subjects[index]), data.cell.x + data.cell.width / 2 + 1.3, data.cell.y + data.cell.height - 2, {
        angle: 90,
      })
    },
  })

  return doc
}
