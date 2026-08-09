import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { addStaff, deleteStaff, getStaffById, getStaff, updateStaff } from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
import { uploadStaffPhoto } from '../middleware/upload.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const staff = await getStaff()
    res.json(staff)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, requireSuperAdmin, uploadStaffPhoto.single('photo'), async (req, res) => {
  const { name, designation, phone } = req.body

  if (!req.file) {
    res.status(400).json({ error: 'photo is required' })
    return
  }

  if (!name || !designation || !phone) {
    res.status(400).json({ error: 'name, designation, and phone are required' })
    return
  }

  let photoUrl
  try {
    photoUrl = await uploadPhoto('staff', req.file)
  } catch (error) {
    res.status(500).json({ error: `Photo upload failed: ${error.message}` })
    return
  }

  try {
    const record = {
      id: crypto.randomUUID(),
      name,
      designation,
      phone,
      photoUrl,
      createdAt: new Date().toISOString(),
    }

    await addStaff(record)
    await recordActivity({ admin: req.admin, action: 'staff.create', targetType: 'staff', details: name })
    res.status(201).json(record)
  } catch (error) {
    await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, requireSuperAdmin, uploadStaffPhoto.single('photo'), async (req, res) => {
  const { id } = req.params
  const { name, designation, phone } = req.body

  if (!name || !designation || !phone) {
    res.status(400).json({ error: 'name, designation, and phone are required' })
    return
  }

  const existing = await getStaffById(id).catch(() => null)
  if (!existing) {
    res.status(404).json({ error: 'Staff member not found' })
    return
  }

  let photoUrl = existing.photoUrl
  if (req.file) {
    try {
      photoUrl = await uploadPhoto('staff', req.file)
    } catch (error) {
      res.status(500).json({ error: `Photo upload failed: ${error.message}` })
      return
    }
  }

  try {
    const updated = await updateStaff(id, { name, designation, phone, photoUrl })
    if (req.file && existing.photoUrl) {
      await deletePhoto(existing.photoUrl)
    }
    await recordActivity({ admin: req.admin, action: 'staff.update', targetType: 'staff', details: name })
    res.json(updated)
  } catch (error) {
    if (req.file) await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await deleteStaff(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Staff member not found' })
      return
    }

    if (deleted.photoUrl) {
      await deletePhoto(deleted.photoUrl)
    }

    await recordActivity({
      admin: req.admin,
      action: 'staff.delete',
      targetType: 'staff',
      details: deleted.name,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
