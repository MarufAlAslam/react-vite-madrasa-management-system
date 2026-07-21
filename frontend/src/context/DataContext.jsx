import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createTeacher as createTeacherBackend,
  createStudent as createStudentBackend,
  getTeachers as getTeachersBackend,
  getStudents as getStudentsBackend,
} from '../services/backendApi'
import {
  createGalleryItem,
  createIncomeExpense,
  createNotice,
  deleteGalleryItem,
  getIncomeExpenses,
  getGallery,
  getNotices,
  updateGalleryItem,
} from '../services/mockApi'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [gallery, setGallery] = useState([])
  const [incomeExpenses, setIncomeExpenses] = useState([])
  const [backendError, setBackendError] = useState(null)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const [noticeData, galleryData, incomeExpenseData] = await Promise.all([
        getNotices(),
        getGallery(),
        getIncomeExpenses(),
      ])
      setNotices(noticeData)
      setGallery(galleryData)
      setIncomeExpenses(incomeExpenseData)

      try {
        const [teacherData, studentData] = await Promise.all([getTeachersBackend(), getStudentsBackend()])
        setTeachers(teacherData)
        setStudents(studentData)
        setBackendError(null)
      } catch (error) {
        setBackendError(error.message)
      }

      setLoading(false)
    }

    loadAll()
  }, [])

  async function addNotice(newNotice) {
    const created = await createNotice(newNotice)
    setNotices((prev) => [created, ...prev])
    return created
  }

  async function addTeacher(formData) {
    const created = await createTeacherBackend(formData)
    setTeachers((prev) => [created, ...prev])
    return created
  }

  async function addStudent(formData) {
    const created = await createStudentBackend(formData)
    setStudents((prev) => [created, ...prev])
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
      students,
      gallery,
      incomeExpenses,
      backendError,
      addNotice,
      addTeacher,
      addStudent,
      addGalleryItem,
      editGalleryItem,
      removeGalleryItem,
      addIncomeExpense,
    }),
    [loading, notices, teachers, students, gallery, incomeExpenses, backendError],
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
