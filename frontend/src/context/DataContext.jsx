import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  createGalleryItem as createGalleryItemBackend,
  createTeacher as createTeacherBackend,
  createStudent as createStudentBackend,
  deleteGalleryItem as deleteGalleryItemBackend,
  deleteStudent as deleteStudentBackend,
  deleteTeacher as deleteTeacherBackend,
  getGallery as getGalleryBackend,
  getTeachers as getTeachersBackend,
  getStudents as getStudentsBackend,
  updateGalleryItem as updateGalleryItemBackend,
  updateStudent as updateStudentBackend,
  updateTeacher as updateTeacherBackend,
} from '../services/backendApi'
import { createNotice, getNotices } from '../services/mockApi'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [gallery, setGallery] = useState([])
  const [backendError, setBackendError] = useState(null)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const noticeData = await getNotices()
      setNotices(noticeData)

      try {
        const [teacherData, studentData, galleryData] = await Promise.all([
          getTeachersBackend(),
          getStudentsBackend(),
          getGalleryBackend(),
        ])
        setTeachers(teacherData)
        setStudents(studentData)
        setGallery(galleryData)
        setBackendError(null)
      } catch (error) {
        setBackendError(error.message)
      }

      setLoading(false)
    }

    loadAll()
  }, [])

  const addNotice = useCallback(async (newNotice) => {
    const created = await createNotice(newNotice)
    setNotices((prev) => [created, ...prev])
    return created
  }, [])

  const addTeacher = useCallback(
    async (formData) => {
      const created = await createTeacherBackend(formData, token)
      setTeachers((prev) => [created, ...prev])
      return created
    },
    [token],
  )

  const editTeacher = useCallback(
    async (id, formData) => {
      const updated = await updateTeacherBackend(id, formData, token)
      setTeachers((prev) => prev.map((teacher) => (teacher.id === id ? updated : teacher)))
      return updated
    },
    [token],
  )

  const removeTeacher = useCallback(
    async (id) => {
      await deleteTeacherBackend(id, token)
      setTeachers((prev) => prev.filter((teacher) => teacher.id !== id))
    },
    [token],
  )

  const addStudent = useCallback(
    async (formData) => {
      const created = await createStudentBackend(formData, token)
      setStudents((prev) => [created, ...prev])
      return created
    },
    [token],
  )

  const editStudent = useCallback(
    async (id, formData) => {
      const updated = await updateStudentBackend(id, formData, token)
      setStudents((prev) => prev.map((student) => (student.id === id ? updated : student)))
      return updated
    },
    [token],
  )

  const removeStudent = useCallback(
    async (id) => {
      await deleteStudentBackend(id, token)
      setStudents((prev) => prev.filter((student) => student.id !== id))
    },
    [token],
  )

  const addGalleryItem = useCallback(
    async (formData) => {
      const created = await createGalleryItemBackend(formData, token)
      setGallery((prev) => [created, ...prev])
      return created
    },
    [token],
  )

  const editGalleryItem = useCallback(
    async (id, formData) => {
      const updated = await updateGalleryItemBackend(id, formData, token)
      setGallery((prev) => prev.map((item) => (item.id === id ? updated : item)))
      return updated
    },
    [token],
  )

  const removeGalleryItem = useCallback(
    async (id) => {
      await deleteGalleryItemBackend(id, token)
      setGallery((prev) => prev.filter((item) => item.id !== id))
    },
    [token],
  )

  const value = useMemo(
    () => ({
      loading,
      notices,
      teachers,
      students,
      gallery,
      backendError,
      addNotice,
      addTeacher,
      editTeacher,
      removeTeacher,
      addStudent,
      editStudent,
      removeStudent,
      addGalleryItem,
      editGalleryItem,
      removeGalleryItem,
    }),
    [
      loading,
      notices,
      teachers,
      students,
      gallery,
      backendError,
      addNotice,
      addTeacher,
      editTeacher,
      removeTeacher,
      addStudent,
      editStudent,
      removeStudent,
      addGalleryItem,
      editGalleryItem,
      removeGalleryItem,
    ],
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
