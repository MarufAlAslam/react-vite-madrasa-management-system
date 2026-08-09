import { useRef, useState } from 'react'
import { useData } from '../../context/DataContext'

const emptyStaffForm = { name: '', designation: '', phone: '' }

function AdminStaffPage() {
  const { backendError, addStaff } = useData()

  const [staffForm, setStaffForm] = useState(emptyStaffForm)
  const [staffPhoto, setStaffPhoto] = useState(null)
  const [staffFormError, setStaffFormError] = useState(null)
  const [staffSubmitting, setStaffSubmitting] = useState(false)
  const staffPhotoInputRef = useRef(null)

  async function handleStaffSubmit(event) {
    event.preventDefault()

    if (!staffPhoto) {
      setStaffFormError('Please choose a photo to upload.')
      return
    }

    setStaffSubmitting(true)
    setStaffFormError(null)

    try {
      const formData = new FormData()
      Object.entries(staffForm).forEach(([key, value]) => formData.append(key, value))
      formData.append('photo', staffPhoto)

      await addStaff(formData)
      setStaffForm(emptyStaffForm)
      setStaffPhoto(null)
      if (staffPhotoInputRef.current) staffPhotoInputRef.current.value = ''
    } catch (error) {
      setStaffFormError(error.message)
    } finally {
      setStaffSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Add Staff</p>
      <h2>Staff Management</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <form className="admin-form" onSubmit={handleStaffSubmit}>
        <input
          type="text"
          placeholder="Staff name"
          value={staffForm.name}
          onChange={(event) => setStaffForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Designation (e.g. Accountant, Office Assistant)"
          value={staffForm.designation}
          onChange={(event) => setStaffForm((prev) => ({ ...prev, designation: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Contact number"
          value={staffForm.phone}
          onChange={(event) => setStaffForm((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />
        <label className="file-input-label">
          <span>Photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={staffPhotoInputRef}
            onChange={(event) => setStaffPhoto(event.target.files[0] || null)}
            required
          />
        </label>
        {staffFormError && <p className="error-text">{staffFormError}</p>}
        <button type="submit" disabled={staffSubmitting}>
          {staffSubmitting ? 'Adding...' : 'Add Staff'}
        </button>
      </form>
    </section>
  )
}

export default AdminStaffPage
