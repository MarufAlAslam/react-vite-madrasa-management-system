import { CLASS_SIX_SECTIONS, isClassSix } from '../../constants/admin'

function StudentSectionSelect({ className, value, onChange }) {
  if (!isClassSix(className)) return null

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} required>
      <option value="">Select section</option>
      {CLASS_SIX_SECTIONS.map((section) => (
        <option key={section} value={section}>
          {section}
        </option>
      ))}
    </select>
  )
}

export default StudentSectionSelect
