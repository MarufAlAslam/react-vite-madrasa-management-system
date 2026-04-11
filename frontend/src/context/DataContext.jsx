import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createGalleryItem,
  createIncomeExpense,
  createNotice,
  createResultRecord,
  createTeacher,
  deleteGalleryItem,
  getIncomeExpenses,
  getGallery,
  getNotices,
  getResultByRollClass,
  getResults,
  getTeachers,
  updateResultRecord,
  updateGalleryItem,
} from '../services/mockApi'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState([])
  const [teachers, setTeachers] = useState([])
  const [gallery, setGallery] = useState([])
  const [results, setResults] = useState([])
  const [incomeExpenses, setIncomeExpenses] = useState([])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const [noticeData, teacherData, galleryData, resultData, incomeExpenseData] = await Promise.all([
        getNotices(),
        getTeachers(),
        getGallery(),
        getResults(),
        getIncomeExpenses(),
      ])
      setNotices(noticeData)
      setTeachers(teacherData)
      setGallery(galleryData)
      setResults(resultData)
      setIncomeExpenses(incomeExpenseData)
      setLoading(false)
    }

    loadAll()
  }, [])

  async function addNotice(newNotice) {
    const created = await createNotice(newNotice)
    setNotices((prev) => [created, ...prev])
    return created
  }

  async function searchResult(roll, className) {
    return getResultByRollClass(roll, className)
  }

  async function addTeacher(newTeacher) {
    const created = await createTeacher(newTeacher)
    setTeachers((prev) => [created, ...prev])
    return created
  }

  async function addGalleryItem(newGalleryItem) {
    const created = await createGalleryItem(newGalleryItem)
    setGallery((prev) => [created, ...prev])
    return created
  }

  async function editGalleryItem(id, payload) {
    const updated = await updateGalleryItem(id, payload)
    if (updated) {
      setGallery((prev) => prev.map((item) => (item.id === id ? updated : item)))
    }
    return updated
  }

  async function removeGalleryItem(id) {
    await deleteGalleryItem(id)
    setGallery((prev) => prev.filter((item) => item.id !== id))
  }

  async function addResultRecord(newResult) {
    const created = await createResultRecord(newResult)
    setResults((prev) => [created, ...prev])
    return created
  }

  async function editResultRecord(id, payload) {
    const updated = await updateResultRecord(id, payload)
    if (updated) {
      setResults((prev) => prev.map((result) => (result.id === id ? updated : result)))
    }
    return updated
  }

  async function addIncomeExpense(newEntry) {
    const created = await createIncomeExpense(newEntry)
    setIncomeExpenses((prev) => [created, ...prev])
    return created
  }

  const value = useMemo(
    () => ({
      loading,
      notices,
      teachers,
      gallery,
      results,
      incomeExpenses,
      addNotice,
      addTeacher,
      addGalleryItem,
      editGalleryItem,
      removeGalleryItem,
      addResultRecord,
      editResultRecord,
      addIncomeExpense,
      searchResult,
    }),
    [loading, notices, teachers, gallery, results, incomeExpenses],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used inside DataProvider')
  }
  return context
}
