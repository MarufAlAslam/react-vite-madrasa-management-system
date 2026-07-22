import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { getAdmins } from '../../services/backendApi'
import { CLASSES } from '../../constants/admin'

const EXPORT_CONFIG = {
  students: {
    label: 'Students',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'className', label: 'Class' },
      { key: 'parentsNames', label: "Parents' Names" },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'contact', label: 'Contact' },
      { key: 'createdAt', label: 'Added On' },
    ],
  },
  teachers: {
    label: 'Teachers',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Designation' },
      { key: 'subject', label: 'Subject' },
      { key: 'indexNo', label: 'Index No.' },
      { key: 'phone', label: 'Phone' },
      { key: 'createdAt', label: 'Added On' },
    ],
  },
  admins: {
    label: 'Admins',
    columns: [
      { key: 'email', label: 'Email' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'createdAt', label: 'Added On' },
    ],
  },
}

function csvEscape(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function AdminExportPage() {
  const { teachers, students } = useData()
  const { token } = useAuth()

  const [exportType, setExportType] = useState('students')
  const [exportClassFilter, setExportClassFilter] = useState('all')
  const [exportFormat, setExportFormat] = useState('csv')
  const [exportError, setExportError] = useState(null)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExportError(null)
    setExporting(true)

    try {
      let rows
      if (exportType === 'teachers') {
        rows = teachers
      } else if (exportType === 'students') {
        rows = exportClassFilter === 'all' ? students : students.filter((s) => s.className === exportClassFilter)
      } else {
        rows = await getAdmins(token)
      }

      const config = EXPORT_CONFIG[exportType]
      const filenameBase = `${exportType}-${
        exportType === 'students' && exportClassFilter !== 'all'
          ? `${exportClassFilter.replace(/\s+/g, '-').toLowerCase()}-`
          : ''
      }export`

      if (exportFormat === 'csv') {
        const header = config.columns.map((column) => csvEscape(column.label)).join(',')
        const lines = rows.map((row) => config.columns.map((column) => csvEscape(row[column.key])).join(','))
        const csv = [header, ...lines].join('\n')
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filenameBase}.csv`)
      } else {
        const doc = new jsPDF()
        doc.text(EXPORT_CONFIG[exportType].label, 14, 16)
        autoTable(doc, {
          startY: 22,
          head: [config.columns.map((column) => column.label)],
          body: rows.map((row) => config.columns.map((column) => String(row[column.key] ?? ''))),
        })
        doc.save(`${filenameBase}.pdf`)
      }
    } catch (error) {
      setExportError(error.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Export Data</p>
      <h2>Download Records</h2>

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
          <option value="admins">Admins</option>
        </select>

        {exportType === 'students' && (
          <select value={exportClassFilter} onChange={(event) => setExportClassFilter(event.target.value)}>
            <option value="all">All classes</option>
            {CLASSES.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        )}

        <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
        </select>

        {exportError && <p className="error-text">{exportError}</p>}
        <button type="submit" disabled={exporting}>
          {exporting ? 'Preparing...' : 'Export'}
        </button>
      </form>
    </section>
  )
}

export default AdminExportPage
