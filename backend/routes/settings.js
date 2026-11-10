import { Router } from 'express'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { getSettings, updateSettings } from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
import { uploadSettingsAssets } from '../middleware/upload.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

const ASSET_FIELDS = [
  { field: 'logo', column: 'logoUrl' },
  { field: 'examControllerSign', column: 'examControllerSignUrl' },
  { field: 'principalSign', column: 'principalSignUrl' },
]

router.get('/', async (req, res) => {
  try {
    res.json(await getSettings())
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post(
  '/',
  requireAuth,
  requireSuperAdmin,
  uploadSettingsAssets.fields(ASSET_FIELDS.map(({ field }) => ({ name: field, maxCount: 1 }))),
  async (req, res) => {
    const existing = await getSettings().catch(() => null)
    const patch = {}
    const uploadedUrls = []

    try {
      for (const { field, column } of ASSET_FIELDS) {
        const file = req.files?.[field]?.[0]
        if (!file) continue

        const url = await uploadPhoto('settings', file)
        uploadedUrls.push(url)
        patch[column] = url
      }

      const madrasaName = typeof req.body?.madrasaName === 'string' ? req.body.madrasaName.trim() : ''
      if (madrasaName.length > 120) {
        res.status(400).json({ error: 'madrasaName must be 120 characters or fewer' })
        return
      }
      if (madrasaName) patch.madrasaName = madrasaName

      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: 'Provide at least one of: madrasaName, logo, examControllerSign, principalSign' })
        return
      }

      const updated = await updateSettings(patch)

      await Promise.all(
        ASSET_FIELDS.filter(({ column }) => patch[column] && existing?.[column]).map(({ column }) =>
          deletePhoto(existing[column]),
        ),
      )

      await recordActivity({
        admin: req.admin,
        action: 'settings.update',
        targetType: 'settings',
        details: Object.keys(patch).join(', '),
      })

      res.json(updated)
    } catch (error) {
      await Promise.all(uploadedUrls.map((url) => deletePhoto(url)))
      res.status(500).json({ error: error.message })
    }
  },
)

export default router
