import { BLOOD_GROUPS, GENDERS } from '../../constants/admin'

function TeacherFormFields({ form, setForm, designations, designationPlaceholder }) {
  function bind(key) {
    return {
      value: form[key],
      onChange: (event) => setForm((prev) => ({ ...prev, [key]: event.target.value })),
    }
  }

  return (
    <>
      <input type="text" placeholder="Teacher name" {...bind('name')} required />
      <select {...bind('designation')} required>
        {designationPlaceholder && <option value="">{designationPlaceholder}</option>}
        {designations.map((designation) => (
          <option key={designation} value={designation}>
            {designation}
          </option>
        ))}
      </select>
      <input type="text" placeholder="Department" {...bind('department')} />
      <input type="text" placeholder="Subject taught" {...bind('subject')} required />
      <input type="text" placeholder="Educational qualification" {...bind('qualification')} />
      <input type="text" placeholder="Index No." {...bind('indexNo')} required />
      <input type="text" placeholder="NID number (admin only)" {...bind('nid')} />
      <input type="text" placeholder="Phone number" {...bind('phone')} required />
      <label className="file-input-label">
        <span>Joining date</span>
        <input type="date" {...bind('joiningDate')} />
      </label>
      <select {...bind('gender')}>
        <option value="">Select gender</option>
        {GENDERS.map((gender) => (
          <option key={gender} value={gender}>
            {gender}
          </option>
        ))}
      </select>
      <select {...bind('bloodGroup')}>
        <option value="">Select blood group</option>
        {BLOOD_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
      <textarea placeholder="Address" rows={3} {...bind('address')} />
    </>
  )
}

export default TeacherFormFields
