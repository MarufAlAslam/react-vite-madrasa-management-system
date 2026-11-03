import { teacherDetails } from '../../utils/teacher'

// Public-facing card: name, photo and every profile field except the NID.
function TeacherCard({ teacher }) {
  return (
    <>
      <img src={teacher.photoUrl} alt={teacher.name} />
      <h3>{teacher.name}</h3>
      <p className="subject-pill">{teacher.designation}</p>
      <dl className="teacher-details">
        {teacherDetails(teacher)
          .filter(([label]) => label !== 'Designation')
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </>
  )
}

export default TeacherCard
