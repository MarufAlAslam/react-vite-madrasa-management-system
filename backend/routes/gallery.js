import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import {
  addGalleryItem,
  deleteGalleryAlbum,
  deleteGalleryItem,
  getGallery,
  getGalleryItemById,
  updateGalleryAlbum,
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

router.post('/album', requireAuth, requireSuperAdmin, upload.array('photos', 20), async (req, res) => {
  const { albumTitle } = req.body
  const featured = req.body.featured === 'true'

  if (!albumTitle || !albumTitle.trim()) {
    res.status(400).json({ error: 'albumTitle is required' })
    return
  }

  if (!req.files || req.files.length === 0) {
    res.status(400).json({ error: 'At least one photo is required' })
    return
  }

  const uploadedUrls = []
  try {
    const created = []
    for (const file of req.files) {
      const photoUrl = await uploadPhoto('gallery', file)
      uploadedUrls.push(photoUrl)

      const record = await addGalleryItem({
        id: crypto.randomUUID(),
        title: '',
        photoUrl,
        createdAt: new Date().toISOString(),
        albumTitle: albumTitle.trim(),
        featured,
      })
      created.push(record)
    }

    await recordActivity({
      admin: req.admin,
      action: 'gallery.album.create',
      targetType: 'gallery',
      details: `${albumTitle.trim()} (${created.length} photo(s))`,
    })
    res.status(201).json(created)
  } catch (error) {
    await Promise.all(uploadedUrls.map((url) => deletePhoto(url)))
    res.status(500).json({ error: error.message })
  }
})

router.put('/album/:albumTitle', requireAuth, requireSuperAdmin, async (req, res) => {
  const currentTitle = req.params.albumTitle
  const { albumTitle, featured } = req.body

  const patch = {}
  if (albumTitle !== undefined && albumTitle.trim()) patch.albumTitle = albumTitle.trim()
  if (featured !== undefined) patch.featured = Boolean(featured)

  try {
    const updated = await updateGalleryAlbum(currentTitle, patch)
    if (updated.length === 0) {
      res.status(404).json({ error: 'Album not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'gallery.album.update',
      targetType: 'gallery',
      details: `${currentTitle} -> ${patch.albumTitle || currentTitle}`,
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/album/:albumTitle', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await deleteGalleryAlbum(req.params.albumTitle)
    if (deleted.length === 0) {
      res.status(404).json({ error: 'Album not found' })
      return
    }

    await Promise.all(deleted.map((item) => (item.photoUrl ? deletePhoto(item.photoUrl) : null)))

    await recordActivity({
      admin: req.admin,
      action: 'gallery.album.delete',
      targetType: 'gallery',
      details: `${req.params.albumTitle} (${deleted.length} photo(s))`,
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, requireSuperAdmin, upload.single('photo'), async (req, res) => {
  const { id } = req.params
  const { title } = req.body

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
    const updated = await updateGalleryItem(id, { title: title ?? existing.title, photoUrl })
    if (req.file && existing.photoUrl) {
      await deletePhoto(existing.photoUrl)
    }
    await recordActivity({ admin: req.admin, action: 'gallery.update', targetType: 'gallery', details: updated.title || updated.albumTitle })
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
      details: deleted.title || deleted.albumTitle,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
