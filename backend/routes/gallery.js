import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import {
  addGalleryItem,
  deleteGalleryItem,
  getGallery,
  getGalleryItemById,
  updateGalleryItem,
} from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
import { uploadTeacherPhoto as upload } from '../middleware/upload.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const gallery = await getGallery()
    res.json(gallery)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, requireSuperAdmin, upload.single('photo'), async (req, res) => {
  const { title } = req.body

  if (!req.file) {
    res.status(400).json({ error: 'photo is required' })
    return
  }

  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }

  let photoUrl
  try {
    photoUrl = await uploadPhoto('gallery', req.file)
  } catch (error) {
    res.status(500).json({ error: `Photo upload failed: ${error.message}` })
    return
  }

  try {
    const record = {
      id: crypto.randomUUID(),
      title,
      photoUrl,
      createdAt: new Date().toISOString(),
    }

    await addGalleryItem(record)
    await recordActivity({ admin: req.admin, action: 'gallery.create', targetType: 'gallery', details: title })
    res.status(201).json(record)
  } catch (error) {
    await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, requireSuperAdmin, upload.single('photo'), async (req, res) => {
  const { id } = req.params
  const { title } = req.body

  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }

  const existing = await getGalleryItemById(id).catch(() => null)
  if (!existing) {
    res.status(404).json({ error: 'Gallery item not found' })
    return
  }

  let photoUrl = existing.photoUrl
  if (req.file) {
    try {
      photoUrl = await uploadPhoto('gallery', req.file)
    } catch (error) {
      res.status(500).json({ error: `Photo upload failed: ${error.message}` })
      return
    }
  }

  try {
    const updated = await updateGalleryItem(id, { title, photoUrl })
    if (req.file && existing.photoUrl) {
      await deletePhoto(existing.photoUrl)
    }
    await recordActivity({ admin: req.admin, action: 'gallery.update', targetType: 'gallery', details: title })
    res.json(updated)
  } catch (error) {
    if (req.file) await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await deleteGalleryItem(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Gallery item not found' })
      return
    }

    if (deleted.photoUrl) {
      await deletePhoto(deleted.photoUrl)
    }

    await recordActivity({
      admin: req.admin,
      action: 'gallery.delete',
      targetType: 'gallery',
      details: deleted.title,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
