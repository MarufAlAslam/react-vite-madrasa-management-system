import jsPDF from 'jspdf'
import { THEME, fitContain, imageUrlToCoverDataUrl, imageUrlToOpaqueDataUrl } from './pdf'

const MADRASA_NAME = 'Moulovirhat H. Fazil Madrasah'
const MADRASA_PHONE = '+880 1771-656565'
const CARD_WIDTH = 85.6
const CARD_HEIGHT = 54
const HEADER_HEIGHT = 13

// Common back side for every ID card.
function drawBackPage(doc, logo) {
  doc.addPage([CARD_WIDTH, CARD_HEIGHT], 'landscape')

  doc.setFillColor(...THEME.green)
  doc.rect(0, CARD_HEIGHT - 9, CARD_WIDTH, 9, 'F')
  doc.setDrawColor(...THEME.gold)
  doc.setLineWidth(0.6)
  doc.rect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2)

  if (logo) {
    const { width, height } = fitContain(logo.aspectRatio, 14, 14)
    doc.addImage(logo.dataUrl, 'JPEG', (CARD_WIDTH - width) / 2, 5, width, height)
  }

  doc.setTextColor(...THEME.ink)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('If found, please return this card to', CARD_WIDTH / 2, 25, { align: 'center' })

  doc.setTextColor(...THEME.green)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(MADRASA_NAME, CARD_WIDTH / 2, 31, { align: 'center' })

  doc.setTextColor(...THEME.ink)
  doc.setFontSize(8)
  doc.text(`Contact: ${MADRASA_PHONE}`, CARD_WIDTH / 2, 37, { align: 'center' })

  doc.setTextColor(255)
  doc.setFontSize(6)
  doc.text('This card is non-transferable and remains the property of the madrasa.', CARD_WIDTH / 2, CARD_HEIGHT - 3.5, {
    align: 'center',
  })
}

async function downloadIdCard({ cardTitle, name, photoUrl, details, filePrefix }, settings) {
  const doc = new jsPDF({ unit: 'mm', format: [CARD_WIDTH, CARD_HEIGHT], orientation: 'landscape' })

  const [photo, logo] = await Promise.all([
    imageUrlToCoverDataUrl(photoUrl, 300, 360).catch(() => null),
    settings?.logoUrl ? imageUrlToOpaqueDataUrl(settings.logoUrl).catch(() => null) : null,
  ])

  doc.setFillColor(...THEME.green)
  doc.rect(0, 0, CARD_WIDTH, HEADER_HEIGHT, 'F')
  doc.setDrawColor(...THEME.gold)
  doc.setLineWidth(0.6)
  doc.rect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2)

  let titleX = CARD_WIDTH / 2
  if (logo) {
    const { width, height } = fitContain(logo.aspectRatio, 9, 9)
    doc.addImage(logo.dataUrl, 'JPEG', 4, (HEADER_HEIGHT - height) / 2, width, height)
    titleX = (CARD_WIDTH + 13) / 2
  }
  doc.setTextColor(255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(MADRASA_NAME, titleX, 6.5, { align: 'center' })
  doc.setFontSize(6)
  doc.text(cardTitle, titleX, 10.5, { align: 'center' })

  if (photo) {
    doc.addImage(photo, 'JPEG', 5, 17, 24, 29)
  }
  doc.setDrawColor(...THEME.gold)
  doc.rect(5, 17, 24, 29)

  doc.setFontSize(7)
  doc.setTextColor(...THEME.ink)
  let y = 20
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 33, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(String(value || '-'), CARD_WIDTH - 57)
    doc.text(lines, 52, y)
    y += Math.max(lines.length, 1) * 3.2 + 2.4
  })

  drawBackPage(doc, logo)

  doc.save(`${filePrefix}-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export function downloadStudentIdCard(student, settings) {
  return downloadIdCard(
    {
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
    settings,
  )
}

export function downloadTeacherIdCard(teacher, settings) {
  return downloadIdCard(
    {
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
    settings,
  )
}
