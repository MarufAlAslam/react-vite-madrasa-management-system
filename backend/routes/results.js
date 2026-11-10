import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireAuthOrTeacher } from '../middleware/auth.js'
import {
  addResult,
  deleteResult,
  getClassByName,
  getResults,
  getStudentById,
  getStudents,
  getTeacherById,
  updateResult,
} from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

// Mirrors GRADE_SCALE in the frontend; teachers' grades are computed here so they can't be forged.
const GRADE_SCALE = [
  ['A+', 80],
  ['A', 70],
  ['A-', 60],
  ['B', 50],
  ['C', 40],
  ['D', 33],
]

function gradeFor(marks, fullMarks) {
  const percentage = (Number(marks) / Number(fullMarks)) * 100
  return GRADE_SCALE.find(([, min]) => percentage >= min)?.[0] ?? 'F'
}

// For a teacher login: the { className, subject } pairs they may enter results for. Null for admins/staff.
async function getTeacherAssignments(admin) {
  if (admin.role !== 'teacher') return null
  const teacher = admin.teacherId ? await getTeacherById(admin.teacherId) : null
  return (teacher?.assignedClasses ?? []).filter((item) => item?.className && item?.subject)
}

function isAssigned(assignments, className, subject) {
  return assignments.some((item) => item.className === className && item.subject === subject)
}

// Validates a teacher's write against their assignments; returns { error, status } or { grade }.
async function checkTeacherWrite(assignments, student, subject, marks) {
  if (!student) return { error: 'Student not found', status: 404 }
  if (!isAssigned(assignments, student.className, subject)) {
    return { error: `You are not assigned to ${subject} in ${student.className}`, status: 403 }
  }

  const classInfo = await getClassByName(student.className)
  const fullMarks = classInfo?.subjects?.find((item) => item.name === subject)?.fullMarks
  const numeric = Number(marks)
  if (!Number.isFinite(numeric) || numeric < 0 || (fullMarks && numeric > fullMarks)) {
    return { error: `marks must be a number between 0 and ${fullMarks ?? 'the full marks'}`, status: 400 }
  }
  return { grade: gradeFor(numeric, fullMarks) }
}

router.get('/', requireAuthOrTeacher, async (req, res) => {
  try {
    const results = await getResults(req.query.studentId)
    const assignments = await getTeacherAssignments(req.admin)

    if (assignments) {
      const classByStudent = new Map((await getStudents()).map((student) => [student.id, student.className]))
      res.json(results.filter((result) => isAssigned(assignments, classByStudent.get(result.studentId), result.subject)))
      return
    }
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuthOrTeacher, async (req, res) => {
  try {
    const { studentId, examName, subject, marks } = req.body
    let { grade } = req.body

    if (!studentId || !examName || !subject || !marks || !grade) {
      res.status(400).json({ error: 'studentId, examName, subject, marks, and grade are required' })
      return
    }

    const assignments = await getTeacherAssignments(req.admin)
    if (assignments) {
      const check = await checkTeacherWrite(assignments, await getStudentById(studentId), subject, marks)
      if (check.error) {
        res.status(check.status).json({ error: check.error })
        return
      }
      grade = check.grade
    }

    const now = new Date().toISOString()
    const record = {
      id: crypto.randomUUID(),
      studentId,
      examName,
      subject,
      marks,
      grade,
      createdAt: now,
      updatedAt: now,
    }

    await addResult(record)
    await recordActivity({
      admin: req.admin,
      action: 'result.create',
      targetType: 'result',
      details: `${examName} - ${subject} (${marks}/${grade}) for student ${studentId}`,
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuthOrTeacher, async (req, res) => {
  try {
    const { examName, subject, marks } = req.body
    let { grade } = req.body

    if (!examName || !subject || !marks || !grade) {
      res.status(400).json({ error: 'examName, subject, marks, and grade are required' })
      return
    }

    const assignments = await getTeacherAssignments(req.admin)
    if (assignments) {
      const existing = (await getResults()).find((result) => result.id === req.params.id)
      if (!existing) {
        res.status(404).json({ error: 'Result not found' })
        return
      }
      if (subject !== existing.subject) {
        res.status(403).json({ error: 'Teachers cannot change the subject of a result' })
        return
      }
      const check = await checkTeacherWrite(assignments, await getStudentById(existing.studentId), existing.subject, marks)
      if (check.error) {
        res.status(check.status).json({ error: check.error })
        return
      }
      grade = check.grade
    }

    const updated = await updateResult(req.params.id, { examName, subject, marks, grade })
    if (!updated) {
      res.status(404).json({ error: 'Result not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'result.update',
      targetType: 'result',
      details: `${examName} - ${subject}`,
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteResult(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Result not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'result.delete',
      targetType: 'result',
      details: `${deleted.examName} - ${deleted.subject}`,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
