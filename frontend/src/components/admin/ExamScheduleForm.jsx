function ExamScheduleForm({ subjects, examName, onExamNameChange, duration, onDurationChange, venue, onVenueChange, scheduleBySubject, onScheduleChange }) {
  return (
    <div className="admin-form">
      <input
        type="text"
        placeholder="Exam name (e.g. 2nd Terminal Examination - 2026)"
        value={examName}
        onChange={(event) => onExamNameChange(event.target.value)}
      />
      <input
        type="text"
        placeholder="Duration (e.g. 3 Hours)"
        value={duration}
        onChange={(event) => onDurationChange(event.target.value)}
      />
      <input
        type="text"
        placeholder="Exam venue (optional)"
        value={venue}
        onChange={(event) => onVenueChange(event.target.value)}
      />

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.name}>
                <td>{subject.name}</td>
                <td>
                  <input
                    type="date"
                    value={scheduleBySubject[subject.name]?.date ?? ''}
                    onChange={(event) => onScheduleChange(subject.name, 'date', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={scheduleBySubject[subject.name]?.time ?? ''}
                    onChange={(event) => onScheduleChange(subject.name, 'time', event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ExamScheduleForm
