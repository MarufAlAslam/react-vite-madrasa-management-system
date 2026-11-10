import jsPDF from 'jspdf'
import { getMadrasaName } from './institution'
import { THEME, imageUrlToCoverDataUrl } from './pdf'

const MADRASA_PHONE = '+880 1771-656565'
const CARD_WIDTH = 54
const CARD_HEIGHT = 85.6
const HEADER_HEIGHT = 12
const PHOTO_WIDTH = 24
const PHOTO_HEIGHT = 27
const MARGIN = 5

function drawBorder(doc) {
  doc.setDrawColor(...THEME.gold)
  doc.setLineWidth(0.6)
  doc.rect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2)
}

// Shrinks the madrasa name until it fits on one line of the card.
function fitMadrasaName(doc, madrasaName, maxFontSize, maxWidth) {
  let size = maxFontSize
  doc.setFontSize(size)
  while (doc.getTextWidth(madrasaName) > maxWidth && size > 4) {
    size -= 0.25
    doc.setFontSize(size)
  }
}

// Common back side for every ID card.
function drawBackPage(doc, madrasaName) {
  doc.addPage([CARD_WIDTH, CARD_HEIGHT], 'portrait')

  doc.setFillColor(...THEME.green)
  doc.rect(0, CARD_HEIGHT - 12, CARD_WIDTH, 12, 'F')
  drawBorder(doc)

  const centerX = CARD_WIDTH / 2
  const textWidth = CARD_WIDTH - MARGIN * 2

  doc.setTextColor(...THEME.ink)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(doc.splitTextToSize('If found, please return this card to', textWidth), centerX, 28, { align: 'center' })

  doc.setTextColor(...THEME.green)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(doc.splitTextToSize(madrasaName, textWidth), centerX, 40, { align: 'center' })

  doc.setTextColor(...THEME.ink)
  doc.setFontSize(7.5)
  doc.text(doc.splitTextToSize(`Contact: ${MADRASA_PHONE}`, textWidth), centerX, 54, { align: 'center' })

  doc.setTextColor(255)
  doc.setFontSize(5)
  doc.text(
    doc.splitTextToSize('This card is non-transferable and remains the property of the madrasa.', textWidth),
    centerX,
    CARD_HEIGHT - 7,
    { align: 'center' },
  )
}

async function downloadIdCard({ madrasaName, cardTitle, name, photoUrl, details, filePrefix }) {
  const doc = new jsPDF({ unit: 'mm', format: [CARD_WIDTH, CARD_HEIGHT], orientation: 'portrait' })
  const photo = await imageUrlToCoverDataUrl(photoUrl, 300, 360).catch(() => null)
  const centerX = CARD_WIDTH / 2

  doc.setFillColor(...THEME.green)
  doc.rect(0, 0, CARD_WIDTH, HEADER_HEIGHT, 'F')
  drawBorder(doc)

  doc.setTextColor(255)
  doc.setFont('helvetica', 'bold')
  fitMadrasaName(doc, madrasaName, 7, CARD_WIDTH - MARGIN * 2)
  doc.text(madrasaName, centerX, 5.5, { align: 'center' })
  doc.setFontSize(5)
  doc.text(cardTitle, centerX, 9, { align: 'center' })

  const photoX = (CARD_WIDTH - PHOTO_WIDTH) / 2
  const photoY = HEADER_HEIGHT + 4
  if (photo) doc.addImage(photo, 'JPEG', photoX, photoY, PHOTO_WIDTH, PHOTO_HEIGHT)
  doc.setDrawColor(...THEME.gold)
  doc.setLineWidth(0.4)
  doc.rect(photoX, photoY, PHOTO_WIDTH, PHOTO_HEIGHT)

  const valueX = 22
  doc.setFontSize(7)
  doc.setTextColor(...THEME.ink)
  let y = photoY + PHOTO_HEIGHT + 5
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(String(value || '-'), CARD_WIDTH - valueX - MARGIN + 1)
    doc.text(lines, valueX, y)
    y += Math.max(lines.length, 1) * 3.2 + 2.2
  })

  drawBackPage(doc, madrasaName)

  doc.save(`${filePrefix}-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export function downloadStudentIdCard(student, settings) {
  return downloadIdCard(
    {
      madrasaName: getMadrasaName(settings),
      cardTitle: 'STUDENT IDENTITY CARD',
      name: student.name,
      photoUrl: student.photoUrl,
      filePrefix: 'id-card',
      details: [
        ['Name', student.name],
        ['Roll', student.roll],
        ['Class', student.className],
        ['Father', student.fatherName],
        ['Contact', student.contact],
      ],
    },
  )
}

export function downloadTeacherIdCard(teacher, settings) {
  return downloadIdCard(
    {
      madrasaName: getMadrasaName(settings),
      cardTitle: 'TEACHER IDENTITY CARD',
      name: teacher.name,
      photoUrl: teacher.photoUrl,
      filePrefix: 'teacher-id-card',
      details: [
        ['Name', teacher.name],
        ['Designation', teacher.designation],
        ['Index No.', teacher.indexNo],
        ['Phone', teacher.phone],
      ],
    },
  )
}
