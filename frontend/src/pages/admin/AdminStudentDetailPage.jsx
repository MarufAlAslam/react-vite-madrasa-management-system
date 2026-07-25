import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import {
  createPayment,
  createResult,
  deletePayment,
  deleteResult,
  getPayments,
  getResults,
  updatePayment,
  updateResult,
} from '../../services/backendApi'
import { drawDoubleBorder, drawProfileHeader, imageUrlToCoverDataUrl, THEME } from '../../utils/pdf'
import { getNextClass } from '../../constants/admin'

const emptyPaymentForm = { title: '', amount: '' }
const emptyResultForm = { examName: '', subject: '', marks: '', grade: '' }

function filenameFor(name, suffix) {
  return `${suffix}-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`
}

function AdminStudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { students, removeStudent, promoteStudent } = useData()
  const { token, isSuperAdmin } = useAuth()

  const student = students.find((item) => item.id === id)
  const nextClass = student ? getNextClass(student.className) : null

  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paymentsError, setPaymentsError] = useState(null)

  const [results, setResults] = useState([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [resultsError, setResultsError] = useState(null)

  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [paymentFormError, setPaymentFormError] = useState(null)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentEdits, setPaymentEdits] = useState({})
  const [paymentRowBusy, setPaymentRowBusy] = useState({})
  const [paymentRowError, setPaymentRowError] = useState({})

  const [resultForm, setResultForm] = useState(emptyResultForm)
  const [resultFormError, setResultFormError] = useState(null)
  const [resultSubmitting, setResultSubmitting] = useState(false)
  const [resultEdits, setResultEdits] = useState({})
  const [resultRowBusy, setResultRowBusy] = useState({})
  const [resultRowError, setResultRowError] = useState({})

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [promoting, setPromoting] = useState(false)
  const [promoteError, setPromoteError] = useState(null)

  const [pdfError, setPdfError] = useState(null)
  const [generating, setGenerating] = useState(null)

  useEffect(() => {
    if (!student) return
    getPayments(student.id, token)
      .then(setPayments)
      .catch((error) => setPaymentsError(error.message))
      .finally(() => setPaymentsLoading(false))

    getResults(student.id, token)
      .then(setResults)
      .catch((error) => setResultsError(error.message))
      .finally(() => setResultsLoading(false))
  }, [student, token])

  if (!student) {
    return <Navigate to="/admin/dashboard/students/list" replace />
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await removeStudent(student.id)
      navigate('/admin/dashboard/students/list')
    } catch (error) {
      setDeleteError(error.message)
      setDeleting(false)
    }
  }

  async function handlePromote() {
    if (!nextClass) return
    if (!window.confirm(`Promote ${student.name} to ${nextClass}?`)) return
    setPromoting(true)
    setPromoteError(null)
    try {
      await promoteStudent(student.id, nextClass)
    } catch (error) {
      setPromoteError(error.message)
    } finally {
      setPromoting(false)
    }
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault()
    setPaymentSubmitting(true)
    setPaymentFormError(null)
    try {
      const created = await createPayment(
        { studentId: student.id, title: paymentForm.title, amount: Number(paymentForm.amount) },
        token,
      )
      setPayments((prev) => [created, ...prev])
      setPaymentForm(emptyPaymentForm)
    } catch (error) {
      setPaymentFormError(error.message)
    } finally {
      setPaymentSubmitting(false)
    }
  }

  function handlePaymentEditChange(paymentId, field, value, current) {
    setPaymentEdits((prev) => ({
      ...prev,
      [paymentId]: {
        title: prev[paymentId]?.title ?? current.title,
        amount: prev[paymentId]?.amount ?? current.amount,
        [field]: value,
      },
    }))
  }

  async function handlePaymentUpdate(paymentId, current) {
    const edited = paymentEdits[paymentId] || {}
    const payload = { title: edited.title ?? current.title, amount: Number(edited.amount ?? current.amount) }

    setPaymentRowBusy((prev) => ({ ...prev, [paymentId]: true }))
    setPaymentRowError((prev) => ({ ...prev, [paymentId]: null }))

    try {
      const updated = await updatePayment(paymentId, payload, token)
      setPayments((prev) => prev.map((payment) => (payment.id === paymentId ? updated : payment)))
      setPaymentEdits((prev) => {
        const next = { ...prev }
        delete next[paymentId]
        return next
      })
    } catch (error) {
      setPaymentRowError((prev) => ({ ...prev, [paymentId]: error.message }))
    } finally {
      setPaymentRowBusy((prev) => ({ ...prev, [paymentId]: false }))
    }
  }

  async function handlePaymentDelete(paymentId) {
    if (!window.confirm('Delete this payment entry?')) return
    setPaymentRowBusy((prev) => ({ ...prev, [paymentId]: true }))
    try {
      await deletePayment(paymentId, token)
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentId))
    } catch (error) {
      setPaymentRowError((prev) => ({ ...prev, [paymentId]: error.message }))
      setPaymentRowBusy((prev) => ({ ...prev, [paymentId]: false }))
    }
  }

  async function handleResultSubmit(event) {
    event.preventDefault()
    setResultSubmitting(true)
    setResultFormError(null)
    try {
      const created = await createResult({ studentId: student.id, ...resultForm }, token)
      setResults((prev) => [created, ...prev])
      setResultForm(emptyResultForm)
    } catch (error) {
      setResultFormError(error.message)
    } finally {
      setResultSubmitting(false)
    }
  }

  function handleResultEditChange(resultId, field, value, current) {
    setResultEdits((prev) => ({
      ...prev,
      [resultId]: {
        examName: prev[resultId]?.examName ?? current.examName,
        subject: prev[resultId]?.subject ?? current.subject,
        marks: prev[resultId]?.marks ?? current.marks,
        grade: prev[resultId]?.grade ?? current.grade,
        [field]: value,
      },
    }))
  }

  async function handleResultUpdate(resultId, current) {
    const edited = resultEdits[resultId] || {}
    const payload = {
      examName: edited.examName ?? current.examName,
      subject: edited.subject ?? current.subject,
      marks: edited.marks ?? current.marks,
      grade: edited.grade ?? current.grade,
    }

    setResultRowBusy((prev) => ({ ...prev, [resultId]: true }))
    setResultRowError((prev) => ({ ...prev, [resultId]: null }))

    try {
      const updated = await updateResult(resultId, payload, token)
      setResults((prev) => prev.map((result) => (result.id === resultId ? updated : result)))
      setResultEdits((prev) => {
        const next = { ...prev }
        delete next[resultId]
        return next
      })
    } catch (error) {
      setResultRowError((prev) => ({ ...prev, [resultId]: error.message }))
    } finally {
      setResultRowBusy((prev) => ({ ...prev, [resultId]: false }))
    }
  }

  async function handleResultDelete(resultId) {
    if (!window.confirm('Delete this result entry?')) return
    setResultRowBusy((prev) => ({ ...prev, [resultId]: true }))
    try {
      await deleteResult(resultId, token)
      setResults((prev) => prev.filter((result) => result.id !== resultId))
    } catch (error) {
      setResultRowError((prev) => ({ ...prev, [resultId]: error.message }))
      setResultRowBusy((prev) => ({ ...prev, [resultId]: false }))
    }
  }

  async function handleDownloadResult() {
    setPdfError(null)
    setGenerating('result')
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      drawDoubleBorder(doc, 14, 14, pageWidth - 28, 38)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...THEME.green)
      doc.setFontSize(16)
      doc.text('Moulovirhat H. Fazil Madrasah', pageWidth / 2, 26, { align: 'center' })
      doc.setFontSize(12)
      doc.text('Result Sheet', pageWidth / 2, 34, { align: 'center' })

      try {
        const photoDataUrl = await imageUrlToCoverDataUrl(student.photoUrl, 300, 300)
        doc.addImage(photoDataUrl, 'JPEG', pageWidth - 40, 18, 22, 22)
      } catch {
        // proceed without photo if it can't be fetched
      }

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...THEME.ink)
      doc.setFontSize(10)
      doc.text(`Name: ${student.name}`, 20, 42)
      doc.text(`Class: ${student.className}    Roll: ${student.roll}`, 20, 47)

      autoTable(doc, {
        startY: 58,
        head: [['Exam', 'Subject', 'Marks', 'Grade']],
        body: results.map((result) => [result.examName, result.subject, result.marks, result.grade]),
        headStyles: { fillColor: THEME.green, textColor: 255 },
        alternateRowStyles: { fillColor: THEME.paperTint },
        styles: { textColor: THEME.ink, lineColor: THEME.gold, lineWidth: 0.2 },
      })

      doc.save(filenameFor(student.name, 'result'))
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGenerating(null)
    }
  }

  async function handleDownloadInvoice() {
    setPdfError(null)
    setGenerating('invoice')
    try {
      const doc = new jsPDF()
      let photoDataUrl = null
      try {
        photoDataUrl = await imageUrlToCoverDataUrl(student.photoUrl, 300, 300)
      } catch {
        photoDataUrl = null
      }

      const startY = drawProfileHeader(doc, {
        title: 'Payment Invoice / History',
        photoDataUrl,
        lines: [`Name: ${student.name}`, `Class: ${student.className}`, `Roll: ${student.roll}`],
      })

      const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

      autoTable(doc, {
        startY,
        head: [['Date', 'Title', 'Amount']],
        body: payments.map((payment) => [payment.date, payment.title, String(payment.amount)]),
        foot: [['', 'Total', String(total)]],
        headStyles: { fillColor: THEME.green, textColor: 255 },
        alternateRowStyles: { fillColor: THEME.paperTint },
        styles: { textColor: THEME.ink, lineColor: THEME.gold, lineWidth: 0.2 },
      })

      doc.save(filenameFor(student.name, 'payment-invoice'))
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGenerating(null)
    }
  }

  async function handleDownloadAdmitCard() {
    setPdfError(null)
    setGenerating('admit')
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const cardX = 14
      const cardY = 20
      const cardWidth = pageWidth - 28
      const cardHeight = 110

      drawDoubleBorder(doc, cardX, cardY, cardWidth, cardHeight)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...THEME.green)
      doc.setFontSize(16)
      doc.text('Moulovirhat H. Fazil Madrasah', pageWidth / 2, cardY + 14, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...THEME.ink)
      doc.text('Bhola, Barisal Division, Bangladesh', pageWidth / 2, cardY + 20, { align: 'center' })

      doc.setDrawColor(...THEME.gold)
      doc.setLineWidth(0.6)
      doc.line(cardX + 20, cardY + 24, cardX + cardWidth - 20, cardY + 24)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...THEME.green)
      doc.text('ADMIT CARD', pageWidth / 2, cardY + 34, { align: 'center' })

      const photoBoxSize = 32
      const photoBoxX = cardX + cardWidth - photoBoxSize - 12
      const photoBoxY = cardY + 40
      doc.setDrawColor(...THEME.green)
      doc.setLineWidth(0.5)
      doc.rect(photoBoxX, photoBoxY, photoBoxSize, photoBoxSize)

      try {
        const photoDataUrl = await imageUrlToCoverDataUrl(student.photoUrl, 300, 300)
        doc.addImage(photoDataUrl, 'JPEG', photoBoxX, photoBoxY, photoBoxSize, photoBoxSize)
      } catch {
        doc.setFontSize(8)
        doc.setTextColor(...THEME.ink)
        doc.text('Photo', photoBoxX + photoBoxSize / 2, photoBoxY + photoBoxSize / 2, { align: 'center' })
      }

      const fieldX = cardX + 14
      const fieldValueX = fieldX + 36
      const lineEndX = photoBoxX - 10
      let y = cardY + 48

      function field(label, value) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...THEME.ink)
        doc.text(label, fieldX, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || ''), fieldValueX, y)
        doc.setDrawColor(...THEME.gold)
        doc.setLineWidth(0.2)
        doc.line(fieldValueX, y + 1.5, lineEndX, y + 1.5)
        y += 12
      }

      field('Name', student.name)
      field("Mother's Name", student.motherName)
      field('Class', student.className)
      field('Roll No.', student.roll)

      const sigY = cardY + cardHeight - 12
      const sigWidth = (cardWidth - 28) / 3
      ;['Issued by Office Incharge', 'Signature of Class Teacher', 'Signature of Candidate'].forEach(
        (label, index) => {
          const startX = cardX + 14 + index * sigWidth
          doc.setDrawColor(...THEME.ink)
          doc.setLineWidth(0.3)
          doc.line(startX, sigY, startX + sigWidth - 20, sigY)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.text(label, startX + (sigWidth - 20) / 2, sigY + 5, { align: 'center' })
        },
      )

      doc.save(filenameFor(student.name, 'admit-card'))
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="section-eyebrow">Student Profile</p>
        <h2>{student.name}</h2>

        <div className="student-detail-header">
          <img className="edit-preview-photo" src={student.photoUrl} alt={student.name} />
          <div>
            <p>
              <strong>Class:</strong> {student.className}
            </p>
            <p>
              <strong>Roll:</strong> {student.roll}
            </p>
            <p>
              <strong>Father:</strong> {student.fatherName}
            </p>
            <p>
              <strong>Mother:</strong> {student.motherName}
            </p>
            <p>
              <strong>Date of Birth:</strong> {student.dob}
            </p>
            <p>
              <strong>Contact:</strong> {student.contact}
            </p>
          </div>
        </div>

        {pdfError && <p className="error-text">{pdfError}</p>}

        <div className="card-actions">
          <button type="button" className="cta-btn" disabled={generating === 'result'} onClick={handleDownloadResult}>
            {generating === 'result' ? 'Preparing...' : 'View Result (PDF)'}
          </button>
          <button
            type="button"
            className="cta-btn"
            disabled={generating === 'invoice'}
            onClick={handleDownloadInvoice}
          >
            {generating === 'invoice' ? 'Preparing...' : 'Payment Invoice (PDF)'}
          </button>
          <button type="button" className="cta-btn" disabled={generating === 'admit'} onClick={handleDownloadAdmitCard}>
            {generating === 'admit' ? 'Preparing...' : 'Download Admit Card (PDF)'}
          </button>
        </div>

        <div className="card-actions">
          <button type="button" className="cta-btn" disabled={!nextClass || promoting} onClick={handlePromote}>
            {promoting ? 'Promoting...' : nextClass ? `Promote to ${nextClass}` : 'No next class'}
          </button>
          {isSuperAdmin && (
            <>
              <Link className="cta-btn" to={`/admin/dashboard/students/${student.id}/edit`}>
                Edit
              </Link>
              <button type="button" className="cta-btn danger-btn" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
        {promoteError && <p className="error-text">{promoteError}</p>}
        {deleteError && <p className="error-text">{deleteError}</p>}
      </section>

      <section className="panel">
        <p className="section-eyebrow">Payments</p>
        <h2>Payment History</h2>

        <form className="admin-form" onSubmit={handlePaymentSubmit}>
          <input
            type="text"
            placeholder="Title (e.g. Tuition Fee - July)"
            value={paymentForm.title}
            onChange={(event) => setPaymentForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Amount"
            value={paymentForm.amount}
            onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
            required
          />
          {paymentFormError && <p className="error-text">{paymentFormError}</p>}
          <button type="submit" disabled={paymentSubmitting}>
            {paymentSubmitting ? 'Saving...' : 'Add Payment'}
          </button>
        </form>

        {paymentsLoading && <div className="empty-state">Loading payments...</div>}
        {paymentsError && <p className="error-text">{paymentsError}</p>}
        {!paymentsLoading && payments.length === 0 && <div className="empty-state">No payments recorded yet.</div>}

        <div className="notice-vertical-list admin-list-gap">
          {payments.map((payment) => {
            const edited = paymentEdits[payment.id]
            const busy = Boolean(paymentRowBusy[payment.id])
            return (
              <article key={payment.id} className="notice-row-card">
                <div>
                  <p className="notice-date">{payment.date}</p>
                  <input
                    type="text"
                    className="inline-edit-input"
                    value={edited?.title ?? payment.title}
                    onChange={(event) => handlePaymentEditChange(payment.id, 'title', event.target.value, payment)}
                    aria-label="Edit payment title"
                  />
                  <input
                    type="number"
                    className="inline-edit-input"
                    value={edited?.amount ?? payment.amount}
                    onChange={(event) => handlePaymentEditChange(payment.id, 'amount', event.target.value, payment)}
                    aria-label="Edit payment amount"
                  />
                  {paymentRowError[payment.id] && <p className="error-text">{paymentRowError[payment.id]}</p>}
                  <div className="gallery-manage-actions">
                    <button type="button" disabled={busy} onClick={() => handlePaymentUpdate(payment.id, payment)}>
                      {busy ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      disabled={busy}
                      onClick={() => handlePaymentDelete(payment.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <p className="section-eyebrow">Results</p>
        <h2>Exam Results</h2>

        <form className="admin-form" onSubmit={handleResultSubmit}>
          <input
            type="text"
            placeholder="Exam name (e.g. Half Yearly)"
            value={resultForm.examName}
            onChange={(event) => setResultForm((prev) => ({ ...prev, examName: event.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Subject"
            value={resultForm.subject}
            onChange={(event) => setResultForm((prev) => ({ ...prev, subject: event.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Marks"
            value={resultForm.marks}
            onChange={(event) => setResultForm((prev) => ({ ...prev, marks: event.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Grade"
            value={resultForm.grade}
            onChange={(event) => setResultForm((prev) => ({ ...prev, grade: event.target.value }))}
            required
          />
          {resultFormError && <p className="error-text">{resultFormError}</p>}
          <button type="submit" disabled={resultSubmitting}>
            {resultSubmitting ? 'Saving...' : 'Add Result'}
          </button>
        </form>

        {resultsLoading && <div className="empty-state">Loading results...</div>}
        {resultsError && <p className="error-text">{resultsError}</p>}
        {!resultsLoading && results.length === 0 && <div className="empty-state">No results recorded yet.</div>}

        <div className="notice-vertical-list admin-list-gap">
          {results.map((result) => {
            const edited = resultEdits[result.id]
            const busy = Boolean(resultRowBusy[result.id])
            return (
              <article key={result.id} className="notice-row-card">
                <div>
                  <input
                    type="text"
                    className="inline-edit-input"
                    value={edited?.examName ?? result.examName}
                    onChange={(event) => handleResultEditChange(result.id, 'examName', event.target.value, result)}
                    aria-label="Edit exam name"
                  />
                  <input
                    type="text"
                    className="inline-edit-input"
                    value={edited?.subject ?? result.subject}
                    onChange={(event) => handleResultEditChange(result.id, 'subject', event.target.value, result)}
                    aria-label="Edit subject"
                  />
                  <input
                    type="text"
                    className="inline-edit-input"
                    value={edited?.marks ?? result.marks}
                    onChange={(event) => handleResultEditChange(result.id, 'marks', event.target.value, result)}
                    aria-label="Edit marks"
                  />
                  <input
                    type="text"
                    className="inline-edit-input"
                    value={edited?.grade ?? result.grade}
                    onChange={(event) => handleResultEditChange(result.id, 'grade', event.target.value, result)}
                    aria-label="Edit grade"
                  />
                  {resultRowError[result.id] && <p className="error-text">{resultRowError[result.id]}</p>}
                  <div className="gallery-manage-actions">
                    <button type="button" disabled={busy} onClick={() => handleResultUpdate(result.id, result)}>
                      {busy ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      disabled={busy}
                      onClick={() => handleResultDelete(result.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AdminStudentDetailPage
