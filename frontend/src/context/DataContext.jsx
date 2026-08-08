import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  assignTeacherClasses as assignTeacherClassesBackend,
  createClass as createClassBackend,
  createExam as createExamBackend,
  createGalleryItem as createGalleryItemBackend,
  createTeacher as createTeacherBackend,
  createStudent as createStudentBackend,
  deleteClass as deleteClassBackend,
  deleteExam as deleteExamBackend,
  deleteGalleryItem as deleteGalleryItemBackend,
  deleteStudent as deleteStudentBackend,
  deleteTeacher as deleteTeacherBackend,
  getClasses as getClassesBackend,
  getExams as getExamsBackend,
  getGallery as getGalleryBackend,
  getSettings as getSettingsBackend,
  getTeachers as getTeachersBackend,
  getStudents as getStudentsBackend,
  promoteStudent as promoteStudentBackend,
  promoteStudentsBulk as promoteStudentsBulkBackend,
  updateClass as updateClassBackend,
  updateGalleryItem as updateGalleryItemBackend,
  updateSettings as updateSettingsBackend,
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
  const [classes, setClasses] = useState([])
  const [settings, setSettings] = useState(null)
  const [exams, setExams] = useState([])
  const [backendError, setBackendError] = useState(null)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const noticeData = await getNotices()
      setNotices(noticeData)

      try {
        const [teacherData, studentData, galleryData, classData, settingsData, examData] = await Promise.all([
          getTeachersBackend(),
          getStudentsBackend(),
          getGalleryBackend(),
          getClassesBackend(),
          getSettingsBackend(),
          getExamsBackend(),
        ])
        setTeachers(teacherData)
        setStudents(studentData)
        setGallery(galleryData)
        setClasses(classData)
        setSettings(settingsData)
        setExams(examData)
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

  const assignTeacherClasses = useCallback(
    async (id, classNames) => {
      const updated = await assignTeacherClassesBackend(id, classNames, token)
      setTeachers((prev) => prev.map((teacher) => (teacher.id === id ? updated : teacher)))
      return updated
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

  const promoteStudent = useCallback(
    async (id, toClass) => {
      const updated = await promoteStudentBackend(id, toClass, token)
      setStudents((prev) => prev.map((student) => (student.id === id ? updated : student)))
      return updated
    },
    [token],
  )

  const bulkPromoteStudents = useCallback(
    async (fromClass, toClass) => {
      const result = await promoteStudentsBulkBackend(fromClass, toClass, token)
      setStudents((prev) =>
        prev.map((student) => (student.className === fromClass ? { ...student, className: toClass } : student)),
      )
      return result
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

  const addClass = useCallback(
    async (payload) => {
      const created = await createClassBackend(payload, token)
      setClasses((prev) => [...prev, created])
      return created
    },
    [token],
  )

  const editClass = useCallback(
    async (className, subjects) => {
      const updated = await updateClassBackend(className, subjects, token)
      setClasses((prev) => prev.map((item) => (item.className === className ? updated : item)))
      return updated
    },
    [token],
  )

  const removeClass = useCallback(
    async (className) => {
      await deleteClassBackend(className, token)
      setClasses((prev) => prev.filter((item) => item.className !== className))
    },
    [token],
  )

  const updateInstitutionSettings = useCallback(
    async (formData) => {
      const updated = await updateSettingsBackend(formData, token)
      setSettings(updated)
      return updated
    },
    [token],
  )

  const addExam = useCallback(
    async (payload) => {
      const created = await createExamBackend(payload, token)
      setExams((prev) => [created, ...prev])
      return created
    },
    [token],
  )

  const removeExam = useCallback(
    async (id) => {
      await deleteExamBackend(id, token)
      setExams((prev) => prev.filter((exam) => exam.id !== id))
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
      classes,
      settings,
      exams,
      backendError,
      addNotice,
      addTeacher,
      editTeacher,
      removeTeacher,
      assignTeacherClasses,
      addStudent,
      editStudent,
      removeStudent,
      promoteStudent,
      bulkPromoteStudents,
      addGalleryItem,
      editGalleryItem,
      removeGalleryItem,
      addClass,
      editClass,
      removeClass,
      updateInstitutionSettings,
      addExam,
      removeExam,
    }),
    [
      loading,
      notices,
      teachers,
      students,
      gallery,
      classes,
      settings,
      exams,
      backendError,
      addNotice,
      addTeacher,
      editTeacher,
      removeTeacher,
      assignTeacherClasses,
      addStudent,
      editStudent,
      removeStudent,
      promoteStudent,
      bulkPromoteStudents,
      addGalleryItem,
      editGalleryItem,
      removeGalleryItem,
      addClass,
      editClass,
      removeClass,
      updateInstitutionSettings,
      addExam,
      removeExam,
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
