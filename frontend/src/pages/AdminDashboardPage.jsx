import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'income-expenses', label: 'Income & Expenses' },
  { id: 'add-teacher', label: 'Add Teacher' },
  { id: 'update-gallery', label: 'Update Gallery' },
  { id: 'update-results', label: 'Update Results' },
  { id: 'logout', label: 'Log Out' },
]

function AdminDashboardPage() {
  const {
    notices,
    teachers,
    gallery,
    results,
    incomeExpenses,
    addTeacher,
    addGalleryItem,
    editGalleryItem,
    removeGalleryItem,
    addResultRecord,
    editResultRecord,
    addIncomeExpense,
  } = useData()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')

  const [teacherForm, setTeacherForm] = useState({
    name: '',
    subject: '',
    phone: '',
    email: '',
    photo: '',
  })
  const [galleryForm, setGalleryForm] = useState({ title: '', image: '' })
  const [resultForm, setResultForm] = useState({
    roll: '',
    className: '',
    studentName: '',
    grade: '',
    remarks: '',
  })
  const [financeForm, setFinanceForm] = useState({ type: 'income', title: '', amount: '' })
  const [galleryEdits, setGalleryEdits] = useState({})
  const [financeFilter, setFinanceFilter] = useState('all')
  const [resultEdits, setResultEdits] = useState({})

  const stats = useMemo(
    () => [
      { label: 'Total Notices', value: notices.length },
      { label: 'Teachers', value: teachers.length },
      { label: 'Gallery Items', value: gallery.length },
      { label: 'Result Records', value: results.length },
    ],
    [notices.length, teachers.length, gallery.length, results.length],
  )

  const financeSummary = useMemo(() => {
    const income = incomeExpenses
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const expense = incomeExpenses
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    return { income, expense, balance: income - expense }
  }, [incomeExpenses])

  const filteredIncomeExpenses = useMemo(() => {
    if (financeFilter === 'all') return incomeExpenses
    return incomeExpenses.filter((entry) => entry.type === financeFilter)
  }, [incomeExpenses, financeFilter])

  async function handleTeacherSubmit(event) {
    event.preventDefault()
    await addTeacher(teacherForm)
    setTeacherForm({ name: '', subject: '', phone: '', email: '', photo: '' })
  }

  async function handleGallerySubmit(event) {
    event.preventDefault()
    await addGalleryItem(galleryForm)
    setGalleryForm({ title: '', image: '' })
  }

  function handleGalleryFieldChange(id, field, value, currentItem) {
    setGalleryEdits((prev) => ({
      ...prev,
      [id]: {
        title: prev[id]?.title ?? currentItem.title,
        image: prev[id]?.image ?? currentItem.image,
        [field]: value,
      },
    }))
  }

  async function handleGalleryUpdate(id, currentItem) {
    const payload = galleryEdits[id] || { title: currentItem.title, image: currentItem.image }
    await editGalleryItem(id, payload)
  }

  async function handleGalleryDelete(id) {
    await removeGalleryItem(id)
    setGalleryEdits((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function handleResultSubmit(event) {
    event.preventDefault()
    const subjectRows = [
      { subject: 'Quran', marks: 76, grade: 'A' },
      { subject: 'Arabic', marks: 72, grade: 'A' },
      { subject: 'Hadith', marks: 74, grade: 'A' },
      { subject: 'Fiqh', marks: 70, grade: 'A-' },
      { subject: 'General Studies', marks: 68, grade: 'A-' },
    ]

    await addResultRecord({ ...resultForm, subjectResults: subjectRows })
    setResultForm({ roll: '', className: '', studentName: '', grade: '', remarks: '' })
  }

  function handleResultFieldChange(id, field, value, currentResult) {
    setResultEdits((prev) => ({
      ...prev,
      [id]: {
        studentName: prev[id]?.studentName ?? currentResult.studentName,
        grade: prev[id]?.grade ?? currentResult.grade,
        remarks: prev[id]?.remarks ?? currentResult.remarks,
        [field]: value,
      },
    }))
  }

  async function handleResultUpdate(id, currentResult) {
    const payload = resultEdits[id] || {
      studentName: currentResult.studentName,
      grade: currentResult.grade,
      remarks: currentResult.remarks,
    }
    await editResultRecord(id, payload)
  }

  async function handleFinanceSubmit(event) {
    event.preventDefault()
    await addIncomeExpense({ ...financeForm, amount: Number(financeForm.amount) })
    setFinanceForm({ type: 'income', title: '', amount: '' })
  }

  function handleTabChange(tabId) {
    if (tabId === 'logout') {
      logout()
      navigate('/admin/login', { replace: true })
      return
    }
    setActiveTab(tabId)
  }

  return (
    <div className="page-stack">
      <section className="panel admin-workspace">
        <p className="section-eyebrow">Admin Panel</p>
        <h2>Management Console</h2>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {tabs.map((tab) => (
            <button
              type="button"
              role="tab"
              key={tab.id}
              aria-selected={activeTab === tab.id}
              className={`admin-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'dashboard' && (
        <section className="panel">
          <p className="section-eyebrow">Dashboard</p>
          <h2>Overview</h2>

          <div className="stats-grid">
            {stats.map((item) => (
              <article className="stat-card" key={item.label}>
                <p>{item.label}</p>
                <h3>{item.value}</h3>
              </article>
            ))}
          </div>

          <div className="notice-vertical-list admin-list-gap">
            {notices.slice(0, 4).map((notice) => (
              <article key={notice.id} className="notice-row-card">
                <div>
                  <p className="notice-date">{notice.date}</p>
                  <h3>{notice.title}</h3>
                  <p>{notice.short}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'income-expenses' && (
        <section className="panel">
          <p className="section-eyebrow">Income & Expenses</p>
          <h2>Financial Entries</h2>

          <div className="finance-filter-row">
            <label htmlFor="finance-filter">Filter:</label>
            <select
              id="finance-filter"
              value={financeFilter}
              onChange={(event) => setFinanceFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="finance-summary-grid">
            <article className="stat-card">
              <p>Total Income</p>
              <h3>{financeSummary.income}</h3>
            </article>
            <article className="stat-card">
              <p>Total Expense</p>
              <h3>{financeSummary.expense}</h3>
            </article>
            <article className="stat-card">
              <p>Balance</p>
              <h3>{financeSummary.balance}</h3>
            </article>
          </div>

          <form className="admin-form" onSubmit={handleFinanceSubmit}>
            <select
              value={financeForm.type}
              onChange={(event) => setFinanceForm((prev) => ({ ...prev, type: event.target.value }))}
              required
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="text"
              placeholder="Entry title"
              value={financeForm.title}
              onChange={(event) => setFinanceForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <input
              type="number"
              min="0"
              placeholder="Amount"
              value={financeForm.amount}
              onChange={(event) => setFinanceForm((prev) => ({ ...prev, amount: event.target.value }))}
              required
            />
            <button type="submit">Save Entry</button>
          </form>

          <div className="notice-vertical-list admin-list-gap">
            {filteredIncomeExpenses.slice(0, 10).map((entry) => (
              <article
                key={entry.id}
                className={`notice-row-card finance-row ${entry.type === 'income' ? 'income-row' : 'expense-row'}`}
              >
                <div>
                  <p className="notice-date">{entry.date}</p>
                  <h3>{entry.title}</h3>
                  <p className={`entry-pill ${entry.type === 'income' ? 'income-pill' : 'expense-pill'}`}>
                    {entry.type.toUpperCase()} - {entry.amount}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'add-teacher' && (
        <section className="panel">
          <p className="section-eyebrow">Add Teacher</p>
          <h2>Faculty Management</h2>

          <form className="admin-form" onSubmit={handleTeacherSubmit}>
            <input
              type="text"
              placeholder="Teacher name"
              value={teacherForm.name}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Subject"
              value={teacherForm.subject}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, subject: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={teacherForm.phone}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, phone: event.target.value }))}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={teacherForm.email}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="url"
              placeholder="Photo URL"
              value={teacherForm.photo}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, photo: event.target.value }))}
              required
            />
            <button type="submit">Add Teacher</button>
          </form>

          <div className="teachers-grid admin-list-gap">
            {teachers.slice(0, 4).map((teacher) => (
              <article key={teacher.id} className="teacher-card">
                <img src={teacher.photo} alt={teacher.name} />
                <h3>{teacher.name}</h3>
                <p className="subject-pill">{teacher.subject}</p>
                <p>{teacher.phone}</p>
                <p>{teacher.email}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'update-gallery' && (
        <section className="panel">
          <p className="section-eyebrow">Update Gallery</p>
          <h2>Gallery Manager</h2>

          <form className="admin-form" onSubmit={handleGallerySubmit}>
            <input
              type="text"
              placeholder="Image title"
              value={galleryForm.title}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <input
              type="url"
              placeholder="Image URL"
              value={galleryForm.image}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, image: event.target.value }))}
              required
            />
            <button type="submit">Add to Gallery</button>
          </form>

          <div className="admin-gallery-list admin-list-gap">
            {gallery.slice(0, 8).map((item) => (
              <article className="gallery-manage-card" key={item.id}>
                <img src={galleryEdits[item.id]?.image || item.image} alt={galleryEdits[item.id]?.title || item.title} />
                <div className="gallery-manage-fields">
                  <input
                    type="text"
                    value={galleryEdits[item.id]?.title || item.title}
                    onChange={(event) => handleGalleryFieldChange(item.id, 'title', event.target.value, item)}
                    aria-label="Gallery title"
                  />
                  <input
                    type="url"
                    value={galleryEdits[item.id]?.image || item.image}
                    onChange={(event) => handleGalleryFieldChange(item.id, 'image', event.target.value, item)}
                    aria-label="Gallery image URL"
                  />
                  <div className="gallery-manage-actions">
                    <button type="button" onClick={() => handleGalleryUpdate(item.id, item)}>
                      Save Update
                    </button>
                    <button type="button" className="danger-btn" onClick={() => handleGalleryDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'update-results' && (
        <section className="panel">
          <p className="section-eyebrow">Update Results</p>
          <h2>Result Manager</h2>

          <form className="admin-form" onSubmit={handleResultSubmit}>
            <input
              type="text"
              placeholder="Roll"
              value={resultForm.roll}
              onChange={(event) => setResultForm((prev) => ({ ...prev, roll: event.target.value }))}
              required
            />
            <select
              value={resultForm.className}
              onChange={(event) => setResultForm((prev) => ({ ...prev, className: event.target.value }))}
              required
            >
              <option value="">Select Class</option>
              <option value="class-4">Class 4</option>
              <option value="class-5">Class 5</option>
              <option value="class-6">Class 6</option>
              <option value="class-7">Class 7</option>
              <option value="class-8">Class 8</option>
            </select>
            <input
              type="text"
              placeholder="Student name"
              value={resultForm.studentName}
              onChange={(event) => setResultForm((prev) => ({ ...prev, studentName: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Grade"
              value={resultForm.grade}
              onChange={(event) => setResultForm((prev) => ({ ...prev, grade: event.target.value }))}
              required
            />
            <textarea
              placeholder="Remarks"
              rows={4}
              value={resultForm.remarks}
              onChange={(event) => setResultForm((prev) => ({ ...prev, remarks: event.target.value }))}
              required
            />
            <button type="submit">Save Result</button>
          </form>

          <div className="notice-vertical-list admin-list-gap">
            {results.slice(0, 6).map((result) => (
              <article key={result.id} className="notice-row-card">
                <div>
                  <p className="notice-date">Roll {result.roll}</p>
                  <input
                    type="text"
                    value={resultEdits[result.id]?.studentName || result.studentName}
                    onChange={(event) =>
                      handleResultFieldChange(result.id, 'studentName', event.target.value, result)
                    }
                    className="inline-edit-input"
                    aria-label="Edit student name"
                  />
                  <p>
                    {result.className.toUpperCase()} - Grade {result.grade}
                  </p>
                  <input
                    type="text"
                    value={resultEdits[result.id]?.grade || result.grade}
                    onChange={(event) => handleResultFieldChange(result.id, 'grade', event.target.value, result)}
                    className="inline-edit-input"
                    aria-label="Edit grade"
                  />
                  <textarea
                    rows={2}
                    value={resultEdits[result.id]?.remarks || result.remarks}
                    onChange={(event) =>
                      handleResultFieldChange(result.id, 'remarks', event.target.value, result)
                    }
                    className="inline-edit-input"
                    aria-label="Edit remarks"
                  />
                  <button type="button" onClick={() => handleResultUpdate(result.id, result)}>
                    Save Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default AdminDashboardPage
