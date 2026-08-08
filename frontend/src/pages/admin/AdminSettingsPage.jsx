import { useRef, useState } from 'react'
import { useData } from '../../context/DataContext'

const ASSET_FIELDS = [
  { field: 'logo', urlKey: 'logoUrl', label: 'Institution Logo' },
  { field: 'examControllerSign', urlKey: 'examControllerSignUrl', label: 'Exam Controller Signature' },
  { field: 'principalSign', urlKey: 'principalSignUrl', label: 'Principal Signature' },
]

function AdminSettingsPage() {
  const { settings, backendError, updateInstitutionSettings } = useData()

  const [files, setFiles] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const inputRefs = useRef({})

  function handleFileChange(field, file) {
    setSaved(false)
    setFiles((prev) => ({ ...prev, [field]: file }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const selected = Object.entries(files).filter(([, file]) => file)
    if (selected.length === 0) {
      setError('Choose at least one file to upload.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      selected.forEach(([field, file]) => formData.append(field, file))
      await updateInstitutionSettings(formData)
      setFiles({})
      ASSET_FIELDS.forEach(({ field }) => {
        if (inputRefs.current[field]) inputRefs.current[field].value = ''
      })
      setSaved(true)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Institution Assets</p>
      <h2>Logo &amp; Signatures</h2>
      <p className="helper-text">
        These images are used on generated admit cards. Upload a new file to replace the current one.
      </p>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        {ASSET_FIELDS.map(({ field, urlKey, label }) => (
          <label className="file-input-label" key={field}>
            <span>{label}</span>
            {settings?.[urlKey] && <img className="settings-asset-preview" src={settings[urlKey]} alt={label} />}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={(el) => (inputRefs.current[field] = el)}
              onChange={(event) => handleFileChange(field, event.target.files[0] || null)}
            />
          </label>
        ))}

        {error && <p className="error-text">{error}</p>}
        {saved && <p className="helper-text">Assets updated.</p>}
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Assets'}
        </button>
      </form>
    </section>
  )
}

export default AdminSettingsPage
