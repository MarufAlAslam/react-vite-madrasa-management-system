import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useData } from '../context/DataContext'

function ResultPage() {
  const { searchResult } = useData()
  const [roll, setRoll] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [result, setResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSearching(true)
    setHasSearched(false)
    const found = await searchResult(roll.trim(), studentClass)
    setResult(found)
    setSearching(false)
    setHasSearched(true)
  }

  function handleExportPdf() {
    if (!result) return

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Darul Noor Madrasa - Result Sheet', 14, 18)

    doc.setFontSize(11)
    doc.text(`Student: ${result.studentName}`, 14, 28)
    doc.text(`Roll: ${result.roll}`, 14, 35)
    doc.text(`Class: ${result.className.replace('-', ' ').toUpperCase()}`, 14, 42)
    doc.text(`Overall Grade: ${result.grade}`, 14, 49)
    doc.text(`Remarks: ${result.remarks}`, 14, 56)

    autoTable(doc, {
      startY: 64,
      head: [['Subject', 'Marks', 'Grade']],
      body: (result.subjectResults || []).map((item) => [item.subject, item.marks, item.grade]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 93, 30] },
    })

    doc.save(`result-${result.roll}.pdf`)
  }

  return (
    <div className="page-stack centered-page">
      <section className="panel result-panel">
        <p className="section-eyebrow">Result Portal</p>
        <h2>Find Student Result</h2>

        <form className="result-search" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Roll Number"
            value={roll}
            onChange={(event) => setRoll(event.target.value)}
            required
          />
          <select
            value={studentClass}
            onChange={(event) => setStudentClass(event.target.value)}
            required
          >
            <option value="">Select Class</option>
            <option value="class-4">Class 4</option>
            <option value="class-5">Class 5</option>
            <option value="class-6">Class 6</option>
            <option value="class-7">Class 7</option>
            <option value="class-8">Class 8</option>
          </select>
          <button type="submit" disabled={searching}>
            {searching ? 'Searching...' : 'Search Result'}
          </button>
        </form>

        {!searching && result && (
          <div className="result-preview">
            <h3>{result.studentName}</h3>
            <p>Roll: {result.roll}</p>
            <p>Class: {result.className.replace('-', ' ').toUpperCase()}</p>
            <p>Grade: {result.grade}</p>
            <p>Remarks: {result.remarks}</p>

            <button type="button" className="export-btn" onClick={handleExportPdf}>
              Export Result Sheet (PDF)
            </button>

            <table className="result-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {result.subjectResults?.map((item) => (
                  <tr key={item.subject}>
                    <td>{item.subject}</td>
                    <td>{item.marks}</td>
                    <td>{item.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!searching && hasSearched && !result && (
          <div className="result-preview not-found">
            <p>No record found for this roll and class.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default ResultPage
