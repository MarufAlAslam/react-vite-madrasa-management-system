import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createIncomeExpense, getIncomeExpenses } from '../../services/backendApi'

function AdminFinancePage() {
  const { token } = useAuth()

  const [incomeExpenses, setIncomeExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [financeForm, setFinanceForm] = useState({ type: 'income', title: '', amount: '' })
  const [financeFormError, setFinanceFormError] = useState(null)
  const [financeSubmitting, setFinanceSubmitting] = useState(false)
  const [financeFilter, setFinanceFilter] = useState('all')

  useEffect(() => {
    getIncomeExpenses(token)
      .then(setIncomeExpenses)
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false))
  }, [token])

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

  async function handleFinanceSubmit(event) {
    event.preventDefault()

    setFinanceSubmitting(true)
    setFinanceFormError(null)

    try {
      const created = await createIncomeExpense(
        { ...financeForm, amount: Number(financeForm.amount) },
        token,
      )
      setIncomeExpenses((prev) => [created, ...prev])
      setFinanceForm({ type: 'income', title: '', amount: '' })
    } catch (error) {
      setFinanceFormError(error.message)
    } finally {
      setFinanceSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Income & Expenses</p>
      <h2>Financial Entries</h2>

      {loadError && <p className="error-text">Could not load financial entries: {loadError}</p>}

      <div className="finance-filter-row">
        <label htmlFor="finance-filter">Filter:</label>
        <select id="finance-filter" value={financeFilter} onChange={(event) => setFinanceFilter(event.target.value)}>
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
        {financeFormError && <p className="error-text">{financeFormError}</p>}
        <button type="submit" disabled={financeSubmitting}>
          {financeSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      </form>

      {loading && <div className="empty-state">Loading entries...</div>}
      {!loading && filteredIncomeExpenses.length === 0 && <div className="empty-state">No entries yet.</div>}

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
  )
}

export default AdminFinancePage
