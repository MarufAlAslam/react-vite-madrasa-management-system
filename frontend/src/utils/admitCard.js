import { THEME, fitContain, imageUrlToCoverDataUrl, imageUrlToOpaqueDataUrl } from './pdf'

const HEADER_HEIGHT = 30
const INFO_ROW_HEIGHT = 7
const INFO_ROWS = 5
const SUBJECT_HEADER_HEIGHT = 7
const SUBJECT_ROW_HEIGHT = 6.5
const SUBJECT_LINE_HEIGHT = 3.8
const SIGNATURE_HEIGHT = 20
const GAP = 4
const BORDER_WIDTH = 0.5
const BODY_TOP_PADDING = 3
const TABLE_GAP = 6

const LABELS = {
  name: 'Name',
  studentId: 'Student ID',
  roll: 'Roll No.',
  registrationNo: 'Reg. No.',
  department: 'Class',
  section: 'Section',
  session: 'Session',
  father: "Father's Name",
  mother: "Mother's Name",
  duration: 'Duration',
  venue: 'Venue',
  title: 'ADMIT CARD',
  serial: 'SL',
  subjectCode: 'Code',
  subject: 'Subject',
  date: 'Date',
  time: 'Time',
  examController: 'Exam Controller',
  principal: 'Principal',
}

function getColWidths(tableWidth) {
  return {
    serial: 10,
    code: 22,
    subject: tableWidth - 10 - 22 - 38 - 28,
    date: 38,
    time: 28,
  }
}

function getSubjectLines(doc, subjects, width) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const tableWidth = width - GAP * 2 - 6
  const subjectColWidth = getColWidths(tableWidth).subject
  const maxTextWidth = subjectColWidth - 3
  return subjects.map((subject) => doc.splitTextToSize(subject.labelEn || subject.name, maxTextWidth))
}

function getSubjectRowHeight(lineCount) {
  return lineCount <= 1 ? SUBJECT_ROW_HEIGHT : SUBJECT_ROW_HEIGHT + (lineCount - 1) * SUBJECT_LINE_HEIGHT
}

export function admitCardNaturalHeight(doc, subjects, width) {
  const subjectsHeight = getSubjectLines(doc, subjects, width).reduce(
    (sum, lines) => sum + getSubjectRowHeight(lines.length),
    0,
  )
  const bodyContentHeight =
    BODY_TOP_PADDING + INFO_ROWS * INFO_ROW_HEIGHT + TABLE_GAP + SUBJECT_HEADER_HEIGHT + subjectsHeight + SIGNATURE_HEIGHT
  return HEADER_HEIGHT + GAP * 2 + bodyContentHeight
}

// Single source of truth for admit-card sizing so a single-student download
// and the bulk (2-per-page) generator always render at identical dimensions —
// the layout is always computed as if fitting two cards per A4 page.
export const PAGE_MARGIN = 10
export const CARD_GAP = 8

export function getAdmitCardLayout(doc, subjects) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const width = pageWidth - PAGE_MARGIN * 2
  const slotHeight = (pageHeight - PAGE_MARGIN * 2 - CARD_GAP) / 2
  const naturalHeight = admitCardNaturalHeight(doc, subjects, width)
  const scale = Math.min(1, slotHeight / naturalHeight)
  return { pageWidth, pageHeight, width, slotHeight, scale }
}

export async function loadInstitutionAssets(settings) {
  const [logo, examControllerSign, principalSign] = await Promise.all([
    settings?.logoUrl ? imageUrlToOpaqueDataUrl(settings.logoUrl).catch(() => null) : Promise.resolve(null),
    settings?.examControllerSignUrl
      ? imageUrlToOpaqueDataUrl(settings.examControllerSignUrl).catch(() => null)
      : Promise.resolve(null),
    settings?.principalSignUrl ? imageUrlToOpaqueDataUrl(settings.principalSignUrl).catch(() => null) : Promise.resolve(null),
  ])
  return { logo, examControllerSign, principalSign }
}

export async function loadStudentPhoto(student) {
  if (!student?.photoUrl) return null
  try {
    return await imageUrlToCoverDataUrl(student.photoUrl, 260, 320)
  } catch {
    return null
  }
}

function studentDisplayId(student) {
  return `STU-${student.id.slice(0, 8).toUpperCase()}`
}

function currentSession() {
  const year = new Date().getFullYear()
  return `Jan ${year}-Dec ${year}`
}

export function drawAdmitCard(doc, { x, y, width, scale, assets, studentPhotoDataUrl, student, examInfo, subjects, scheduleBySubject }) {
  const subjectLines = getSubjectLines(doc, subjects, width)
  const height = admitCardNaturalHeight(doc, subjects, width) * scale
  const s = (value) => value * scale

  doc.setFont('helvetica', 'normal')
  doc.setDrawColor(...THEME.ink)
  doc.setLineWidth(0.3)
  doc.rect(x, y, width, height)

  const headerHeight = s(HEADER_HEIGHT) - s(GAP)
  doc.setDrawColor(...THEME.green)
  doc.setLineWidth(s(BORDER_WIDTH))
  doc.rect(x + s(GAP), y + s(GAP), width - s(GAP) * 2, headerHeight)

  const logoBoxSize = headerHeight - s(6)
  const logoX = x + s(GAP) + s(3)
  const logoY = y + s(GAP) + s(3)
  if (assets.logo) {
    const fit = fitContain(assets.logo.aspectRatio, logoBoxSize, logoBoxSize)
    doc.addImage(assets.logo.dataUrl, 'JPEG', logoX, logoY, fit.width, fit.height)
  }

  const textStartX = logoX + logoBoxSize + s(4)
  doc.setTextColor(...THEME.green)
  doc.setFontSize(s(15))
  doc.setFont('helvetica', 'bold')
  doc.text('Moulovirhat H. Fazil Madrasah', textStartX, y + s(15))
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...THEME.ink)
  doc.setFontSize(s(8))
  doc.text('Bhola, Barisal Division, Bangladesh', textStartX, y + s(21))

  doc.setTextColor(...THEME.green)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(s(13))
  doc.text(LABELS.title, x + width - s(GAP) - s(3), y + s(14), { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...THEME.ink)
  doc.setFontSize(s(8.5))
  doc.text(examInfo.examName || '', x + width - s(GAP) - s(3), y + s(21), { align: 'right' })

  let bodyTop = y + s(HEADER_HEIGHT) + s(GAP)
  const bodyHeight = height - s(HEADER_HEIGHT) - s(GAP) * 2
  doc.setDrawColor(...THEME.green)
  doc.setLineWidth(s(BORDER_WIDTH))
  doc.rect(x + s(GAP), bodyTop, width - s(GAP) * 2, bodyHeight)

  const photoBoxWidth = s(24)
  const photoBoxHeight = s(28)
  const photoBoxX = x + width - s(GAP) - s(3) - photoBoxWidth
  const photoBoxY = bodyTop + s(BODY_TOP_PADDING)
  doc.setDrawColor(...THEME.green)
  doc.setLineWidth(s(BORDER_WIDTH))
  doc.rect(photoBoxX, photoBoxY, photoBoxWidth, photoBoxHeight)
  if (studentPhotoDataUrl) {
    doc.addImage(studentPhotoDataUrl, 'JPEG', photoBoxX, photoBoxY, photoBoxWidth, photoBoxHeight)
  }

  const infoX = x + s(GAP) + s(3)
  const infoWidth = photoBoxX - s(4) - infoX
  const rows = [
    [{ label: LABELS.name, value: student.name, weight: 1 }],
    [
      { label: LABELS.studentId, value: studentDisplayId(student), weight: 1 },
      { label: LABELS.roll, value: student.roll, weight: 1 },
      { label: LABELS.registrationNo, value: student.registrationNo || '-', weight: 1 },
    ],
    [
      { label: LABELS.department, value: student.className, weight: 1 },
      { label: LABELS.section, value: student.section || '-', weight: 1 },
      { label: LABELS.session, value: currentSession(), weight: 1 },
    ],
    [
      { label: LABELS.father, value: student.fatherName, weight: 1 },
      { label: LABELS.mother, value: student.motherName, weight: 1 },
    ],
    [
      { label: LABELS.duration, value: examInfo.duration || '-', weight: 1 },
      { label: LABELS.venue, value: examInfo.venue || 'Moulovirhat H. Fazil Madrasah', weight: 1 },
    ],
  ]

  doc.setDrawColor(...THEME.ink)
  doc.setLineWidth(s(0.2))
  let rowY = bodyTop + s(BODY_TOP_PADDING)
  const infoRowHeight = s(INFO_ROW_HEIGHT)
  rows.forEach((row) => {
    const totalWeight = row.reduce((sum, cell) => sum + cell.weight, 0)
    let cellX = infoX
    row.forEach((cell) => {
      const cellWidth = (infoWidth * cell.weight) / totalWeight
      doc.rect(cellX, rowY, cellWidth, infoRowHeight)
      doc.setFontSize(s(8.5))
      doc.setTextColor(...THEME.ink)
      doc.text(`${cell.label}: ${cell.value || ''}`, cellX + s(1.5), rowY + infoRowHeight * 0.68)
      cellX += cellWidth
    })
    rowY += infoRowHeight
  })

  const tableTop = bodyTop + s(INFO_ROWS * INFO_ROW_HEIGHT) + s(TABLE_GAP)
  const tableX = x + s(GAP) + s(3)
  const tableWidth = width - s(GAP) * 2 - s(6)
  const colWidths = getColWidths(tableWidth)

  let colX = tableX
  ;[
    { key: 'serial', label: LABELS.serial },
    { key: 'code', label: LABELS.subjectCode },
    { key: 'subject', label: LABELS.subject },
    { key: 'date', label: LABELS.date },
    { key: 'time', label: LABELS.time },
  ].forEach(({ key, label }) => {
    doc.setFillColor(...THEME.green)
    doc.rect(colX, tableTop, colWidths[key], s(SUBJECT_HEADER_HEIGHT), 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(s(8))
    doc.text(label, colX + colWidths[key] / 2, tableTop + s(SUBJECT_HEADER_HEIGHT) * 0.68, { align: 'center' })
    colX += colWidths[key]
  })

  doc.setTextColor(...THEME.ink)
  doc.setDrawColor(...THEME.ink)
  doc.setLineWidth(s(0.2))
  let subjectRowY = tableTop + s(SUBJECT_HEADER_HEIGHT)
  subjects.forEach((subject, index) => {
    const lines = subjectLines[index]
    const rowHeight = s(getSubjectRowHeight(lines.length))
    const schedule = scheduleBySubject[subject.name] || {}
    const values = [String(index + 1), subject.code || '', lines, schedule.date || '', schedule.time || '']
    const keys = ['serial', 'code', 'subject', 'date', 'time']

    colX = tableX
    doc.setFontSize(s(8))
    keys.forEach((key, i) => {
      doc.rect(colX, subjectRowY, colWidths[key], rowHeight)
      const align = key === 'subject' ? 'left' : 'center'
      const textX = align === 'left' ? colX + s(1.5) : colX + colWidths[key] / 2
      doc.text(values[i], textX, subjectRowY + s(4), { align })
      colX += colWidths[key]
    })
    subjectRowY += rowHeight
  })

  const sigY = bodyTop + bodyHeight - s(8)
  const sigLineWidth = s(48)

  function drawSignature(signAsset, label, lineX) {
    if (signAsset) {
      const fit = fitContain(signAsset.aspectRatio, sigLineWidth, s(SIGNATURE_HEIGHT) - s(10))
      doc.addImage(signAsset.dataUrl, 'JPEG', lineX + (sigLineWidth - fit.width) / 2, sigY - fit.height - s(1), fit.width, fit.height)
    }
    doc.setDrawColor(...THEME.ink)
    doc.setLineWidth(s(0.25))
    doc.line(lineX, sigY, lineX + sigLineWidth, sigY)
    doc.setFontSize(s(8))
    doc.setTextColor(...THEME.ink)
    doc.text(label, lineX + sigLineWidth / 2, sigY + s(4), { align: 'center' })
  }

  drawSignature(assets.principalSign, LABELS.principal, x + s(GAP) + s(6))
  drawSignature(assets.examControllerSign, LABELS.examController, x + width - s(GAP) - s(6) - sigLineWidth)
}

export function drawCuttingLine(doc, y, pageWidth) {
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(0, y, pageWidth, y)
  doc.setLineDashPattern([], 0)

  const cx = 8
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.35)
  doc.line(cx, y, cx - 2.2, y - 2.2)
  doc.line(cx, y, cx - 2.2, y + 2.2)
  doc.circle(cx - 3.4, y - 3.4, 1, 'S')
  doc.circle(cx - 3.4, y + 3.4, 1, 'S')
}
