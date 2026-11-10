import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useData } from '../../context/DataContext'
import { sortByDesignation, sortStudents } from '../../constants/admin'
import { imageUrlToCoverDataUrl, THEME } from '../../utils/pdf'
import { formatDate } from '../../utils/teacher'

const PHOTO_CELL_SIZE = 16

const EXPORT_CONFIG = {
  students: {
    label: 'Students',
    columns: [
      { key: 'photoUrl', label: 'Photo', isImage: true },
      { key: 'name', label: 'Name' },
      { key: 'roll', label: 'Roll' },
      { key: 'fatherName', label: 'Father' },
      { key: 'motherName', label: 'Mother' },
      { key: 'contact', label: 'Contact' },
    ],
  },
  teachers: {
    label: 'Teachers',
    columns: [
      { key: 'serial', label: 'SL', isSerial: true },
      { key: 'photoUrl', label: 'Photo', isImage: true },
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Designation' },
      { key: 'subject', label: 'Subject' },
      { key: 'indexNo', label: 'Index No.' },
      { key: 'phone', label: 'Phone' },
      { key: 'joiningDate', label: 'Joining Date', format: formatDate },
    ],
  },
}

// Principal first, then Vice Principal and so on; teachers with the same designation go by joining date, then name.
function sortTeachersForExport(teachers) {
  const byJoiningThenName = [...teachers].sort(
    (a, b) => (a.joiningDate || '9999').localeCompare(b.joiningDate || '9999') || a.name.localeCompare(b.name),
  )
  return sortByDesignation(byJoiningThenName)
}

function AdminExportPage() {
  const { teachers, students, classes } = useData()

  const [exportType, setExportType] = useState('students')
  const [exportClass, setExportClass] = useState('')
  const [exportError, setExportError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!exportClass && classes.length > 0) {
      setExportClass(classes[0].className)
    }
  }, [classes, exportClass])

  async function handleExport() {
    setExportError(null)
    setExporting(true)

    try {
      const rows =
        exportType === 'teachers'
          ? sortTeachersForExport(teachers)
          : sortStudents(
              students.filter((s) => s.className === exportClass),
              [exportClass],
            )

      if (rows.length === 0) {
        setExportError('No records match this selection.')
        return
      }

      const config = EXPORT_CONFIG[exportType]
      const photoIndex = config.columns.findIndex((column) => column.isImage)

      const photoDataUrls = await Promise.all(
        rows.map((row) => imageUrlToCoverDataUrl(row.photoUrl, 200, 200).catch(() => null)),
      )

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...THEME.green)
      doc.setFontSize(16)
      doc.text(
        exportType === 'students' ? `${config.label} — ${exportClass}` : config.label,
        14,
        16,
      )

      autoTable(doc, {
        startY: 22,
        head: [config.columns.map((column) => column.label)],
        body: rows.map((row, index) =>
          config.columns.map((column) => {
            if (column.isImage) return ''
            if (column.isSerial) return String(index + 1)
            const value = row[column.key] ?? ''
            return String(column.format && value ? column.format(value) : value)
          }),
        ),
        styles: { minCellHeight: PHOTO_CELL_SIZE + 4, valign: 'middle', textColor: THEME.ink, lineColor: THEME.gold, lineWidth: 0.2 },
        headStyles: { fillColor: THEME.green, textColor: 255 },
        alternateRowStyles: { fillColor: THEME.paperTint },
        columnStyles: { [photoIndex]: { cellWidth: PHOTO_CELL_SIZE + 6 } },
        didDrawCell(data) {
          if (data.section === 'body' && data.column.index === photoIndex) {
            const dataUrl = photoDataUrls[data.row.index]
            if (dataUrl) {
              doc.addImage(dataUrl, 'JPEG', data.cell.x + 3, data.cell.y + 2, PHOTO_CELL_SIZE, PHOTO_CELL_SIZE)
            }
          }
        },
      })

      const suffix = exportType === 'students' ? exportClass.replace(/\s+/g, '-').toLowerCase() : 'all'
      doc.save(`${exportType}-${suffix}.pdf`)
    } catch (error) {
      setExportError(error.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Export Data</p>
      <h2>Download Records (PDF)</h2>

      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault()
          handleExport()
        }}
      >
        <select value={exportType} onChange={(event) => setExportType(event.target.value)}>
          <option value="students">Students</option>
          <option value="teachers">Teachers</option>
        </select>

        {exportType === 'students' && (
          <select value={exportClass} onChange={(event) => setExportClass(event.target.value)}>
            {classes.map((classItem) => (
              <option key={classItem.className} value={classItem.className}>
                {classItem.className}
              </option>
            ))}
          </select>
        )}

        {exportError && <p className="error-text">{exportError}</p>}
        <button type="submit" disabled={exporting}>
          {exporting ? 'Preparing PDF...' : 'Export PDF'}
        </button>
      </form>
    </section>
  )
}

export default AdminExportPage
