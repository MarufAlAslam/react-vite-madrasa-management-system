export const THEME = {
  green: [11, 93, 30],
  greenLight: [27, 127, 50],
  gold: [200, 169, 81],
  ink: [29, 37, 31],
  paperTint: [244, 248, 241],
}

export async function imageUrlToDataUrl(url) {
  const response = await fetch(url)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function dataUrlFormat(dataUrl) {
  const match = /^data:image\/(\w+);/.exec(dataUrl)
  if (!match) return 'JPEG'
  const type = match[1].toUpperCase()
  return type === 'JPG' ? 'JPEG' : type
}

// Fetches an image and crops/scales it to exactly fill targetWidth x targetHeight,
// anchored to the top (mirrors CSS `object-fit: cover; object-position: top`),
// so it can be embedded in a PDF without distortion regardless of source aspect ratio.
export async function imageUrlToCoverDataUrl(url, targetWidth, targetHeight) {
  const response = await fetch(url)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')

  const scale = Math.max(targetWidth / bitmap.width, targetHeight / bitmap.height)
  const drawWidth = bitmap.width * scale
  const drawHeight = bitmap.height * scale
  const dx = (targetWidth - drawWidth) / 2
  const dy = 0 // anchor to top

  ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight)

  return canvas.toDataURL('image/jpeg', 0.92)
}

export function drawDoubleBorder(doc, x, y, width, height, { outerColor = THEME.green, innerColor = THEME.gold, gap = 3 } = {}) {
  doc.setDrawColor(...outerColor)
  doc.setLineWidth(1)
  doc.rect(x, y, width, height)
  doc.setDrawColor(...innerColor)
  doc.setLineWidth(0.4)
  doc.rect(x + gap, y + gap, width - gap * 2, height - gap * 2)
}

export function drawProfileHeader(doc, { title, photoDataUrl, lines }) {
  doc.setTextColor(...THEME.green)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 14, 18)

  if (photoDataUrl) {
    doc.addImage(photoDataUrl, 'JPEG', 150, 10, 40, 40)
  }

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...THEME.ink)
  doc.setFontSize(11)
  let y = 32
  lines.forEach((line) => {
    doc.text(line, 14, y)
    y += 7
  })

  return y + 6
}
