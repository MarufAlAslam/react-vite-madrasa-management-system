import jsPDF from 'jspdf'
import { THEME, imageUrlToCoverDataUrl } from './pdf'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 8
const GUTTER = 4
const COLUMNS = 2
const CARD_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS
const CARD_HEIGHT = 36
const ROWS = Math.floor((PAGE_HEIGHT - MARGIN * 2 + GUTTER) / (CARD_HEIGHT + GUTTER))
const PHOTO_WIDTH = 28
const PHOTO_HEIGHT = 30
const PADDING = 3

function drawCard(doc, x, y, student, photo) {
  doc.setDrawColor(...THEME.green)
  doc.setLineWidth(0.4)
  doc.rect(x, y, CARD_WIDTH, CARD_HEIGHT)

  const photoY = y + (CARD_HEIGHT - PHOTO_HEIGHT) / 2
  if (photo) doc.addImage(photo, 'JPEG', x + PADDING, photoY, PHOTO_WIDTH, PHOTO_HEIGHT)
  doc.setDrawColor(...THEME.gold)
  doc.setLineWidth(0.3)
  doc.rect(x + PADDING, photoY, PHOTO_WIDTH, PHOTO_HEIGHT)

  const textX = x + PADDING * 2 + PHOTO_WIDTH
  const textWidth = CARD_WIDTH - (textX - x) - PADDING
  const className = student.section ? `${student.className} (${student.section})` : student.className

  doc.setFontSize(8.5)
  doc.setTextColor(...THEME.ink)
  let lineY = y + 8
  ;[
    ['Name', student.name],
    ['Father', student.fatherName],
    ['Roll', student.roll],
    ['Class', className],
  ].forEach(([label, value]) => {
    const lines = doc.splitTextToSize(`${label}: ${value || '-'}`, textWidth)
    doc.setFont('helvetica', label === 'Name' ? 'bold' : 'normal')
    doc.text(lines, textX, lineY)
    lineY += lines.length * 3.6 + 1.6
  })
}

// Dashed cut lines run through the gutters between cards.
function drawCutMarks(doc, rowCount, columnCount) {
  doc.setDrawColor(120)
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([1.5, 1.5], 0)

  const gridBottom = MARGIN + rowCount * CARD_HEIGHT + (rowCount - 1) * GUTTER
  const gridRight = MARGIN + columnCount * CARD_WIDTH + (columnCount - 1) * GUTTER

  for (let column = 1; column < columnCount; column += 1) {
    const x = MARGIN + column * CARD_WIDTH + (column - 1) * GUTTER + GUTTER / 2
    doc.line(x, MARGIN - 3, x, gridBottom + 3)
  }
  for (let row = 1; row < rowCount; row += 1) {
    const y = MARGIN + row * CARD_HEIGHT + (row - 1) * GUTTER + GUTTER / 2
    doc.line(MARGIN - 3, y, gridRight + 3, y)
  }

  doc.setLineDashPattern([], 0)
}

export async function buildSeatPlanPdf(students) {
  const sorted = [...students].sort((a, b) => Number(a.roll) - Number(b.roll))
  const photos = await Promise.all(
    sorted.map((student) => imageUrlToCoverDataUrl(student.photoUrl, 200, 214).catch(() => null)),
  )

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const perPage = COLUMNS * ROWS

  sorted.forEach((student, index) => {
    const position = index % perPage
    if (index > 0 && position === 0) doc.addPage()

    const column = position % COLUMNS
    drawCard(
      doc,
      MARGIN + column * (CARD_WIDTH + GUTTER),
      MARGIN + Math.floor(position / COLUMNS) * (CARD_HEIGHT + GUTTER),
      student,
      photos[index],
    )

    const isLastOnPage = position === perPage - 1 || index === sorted.length - 1
    if (isLastOnPage) {
      const onPage = position + 1
      drawCutMarks(doc, Math.ceil(onPage / COLUMNS), Math.min(onPage, COLUMNS))
    }
  })

  return doc
}
