import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'
import { createPayment, deletePayment, getPayments, updatePayment } from '../../services/backendApi'
import { drawProfileHeader, imageUrlToCoverDataUrl, THEME } from '../../utils/pdf'
import { downloadStudentIdCard } from '../../utils/idCard'
import { getNextClass } from '../../constants/admin'
import StudentResultsPanel from '../../components/admin/StudentResultsPanel'
import { drawAdmitCard, getAdmitCardLayout, loadInstitutionAssets, loadStudentPhoto, PAGE_MARGIN } from '../../utils/admitCard'

const emptyPaymentForm = { title: '', amount: '' }

function filenameFor(name, suffix) {
  return `${suffix}-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`
}

function AdminStudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { students, classes, settings, exams, removeStudent, promoteStudent } = useData()
  const { token, isSuperAdmin } = useAuth()
  const confirm = useConfirm()

  const student = students.find((item) => item.id === id)
  const classNames = classes.map((item) => item.className)
  const nextClass = student ? getNextClass(classNames, student.className) : null
  const studentSubjects = classes.find((item) => item.className === student?.className)?.subjects ?? []

  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paymentsError, setPaymentsError] = useState(null)

  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [paymentFormError, setPaymentFormError] = useState(null)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentEdits, setPaymentEdits] = useState({})
  const [paymentRowBusy, setPaymentRowBusy] = useState({})
  const [paymentRowError, setPaymentRowError] = useState({})

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [promoting, setPromoting] = useState(false)
  const [promoteError, setPromoteError] = useState(null)

  const [pdfError, setPdfError] = useState(null)
  const [generating, setGenerating] = useState(null)

  const [showAdmitForm, setShowAdmitForm] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState('')
  const studentExams = exams.filter((exam) => exam.className === student?.className)

  useEffect(() => {
    if (!student) return
    getPayments(student.id, token)
      .then(setPayments)
      .catch((error) => setPaymentsError(error.message))
      .finally(() => setPaymentsLoading(false))
  }, [student, token])

  if (!student) {
    return <Navigate to="/admin/dashboard/students/list" replace />
  }

  async function handleDelete() {
    if (!(await confirm(`Delete ${student.name}? This cannot be undone.`, { danger: true }))) return
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
    if (!(await confirm(`Promote ${student.name} to ${nextClass}?`))) return
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
    if (!(await confirm('Delete this payment entry?', { danger: true }))) return
    setPaymentRowBusy((prev) => ({ ...prev, [paymentId]: true }))
    try {
      await deletePayment(paymentId, token)
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentId))
    } catch (error) {
      setPaymentRowError((prev) => ({ ...prev, [paymentId]: error.message }))
      setPaymentRowBusy((prev) => ({ ...prev, [paymentId]: false }))
    }
  }

  async function handleDownloadInvoice() {
    setPdfError(null)
    setGenerating('invoice')
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
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

  async function handleDownloadIdCard() {
    setPdfError(null)
    setGenerating('idcard')
    try {
      await downloadStudentIdCard(student)
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGenerating(null)
    }
  }

  async function handleDownloadAdmitCard() {
    const exam = studentExams.find((item) => item.id === selectedExamId)
    if (!exam) {
      setPdfError('Select an exam first.')
      return
    }

    setPdfError(null)
    setGenerating('admit')
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const { width, scale } = getAdmitCardLayout(doc, studentSubjects)

      const [assets, studentPhotoDataUrl] = await Promise.all([
        loadInstitutionAssets(settings),
        loadStudentPhoto(student),
      ])

      drawAdmitCard(doc, {
        x: PAGE_MARGIN,
        y: PAGE_MARGIN,
        width,
        scale,
        assets,
        studentPhotoDataUrl,
        student,
        examInfo: { examName: exam.name },
        subjects: studentSubjects,
        scheduleBySubject: exam.schedule,
      })

      doc.save(filenameFor(`${student.name}-${exam.name}`, 'admit-card'))
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
            <p>
              <strong>Registration No.:</strong> {student.registrationNo || '-'}
            </p>
            <p>
              <strong>Section:</strong> {student.section || '-'}
            </p>
          </div>
        </div>

        {pdfError && <p className="error-text">{pdfError}</p>}

        <div className="card-actions">
          <button
            type="button"
            className="cta-btn"
            disabled={generating === 'invoice'}
            onClick={handleDownloadInvoice}
          >
            {generating === 'invoice' ? 'Preparing...' : 'Payment Invoice (PDF)'}
          </button>
          <button
            type="button"
            className="cta-btn"
            disabled={generating === 'idcard'}
            onClick={handleDownloadIdCard}
          >
            {generating === 'idcard' ? 'Preparing...' : 'Student ID Card (PDF)'}
          </button>
          <button type="button" className="cta-btn" onClick={() => setShowAdmitForm((prev) => !prev)}>
            {showAdmitForm ? 'Hide Admit Card Form' : 'Download Admit Card (PDF)'}
          </button>
        </div>

        {showAdmitForm && (
          <div className="admin-form">
            {studentExams.length === 0 ? (
              <>
                <p className="helper-text">No exams created yet for {student.className}.</p>
                <div className="card-actions">
                  <Link className="cta-btn" to="/admin/dashboard/exams">
                    Create Exam
                  </Link>
                </div>
              </>
            ) : (
              <>
                <label className="file-input-label">
                  <span>Exam</span>
                  <select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
                    <option value="">Choose an exam...</option>
                    {studentExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="card-actions">
                  <button
                    type="button"
                    className="cta-btn"
                    disabled={generating === 'admit' || !selectedExamId}
                    onClick={handleDownloadAdmitCard}
                  >
                    {generating === 'admit' ? 'Preparing...' : 'Generate Admit Card'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

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

      <StudentResultsPanel student={student} />
    </div>
  )
}

export default AdminStudentDetailPage
