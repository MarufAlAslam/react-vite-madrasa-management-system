const icons = {
  location: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55v-2.14c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.16 21 3 14.84 3 7a2 2 0 0 1 1-2Z" />
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      <path d="M22 9v6" />
    </svg>
  ),
}

const education = [
  {
    degree: 'B.Sc. in Computer Science and Engineering',
    institution: 'Patuakhali Science and Technology University, Bangladesh',
  },
  {
    degree: 'M.Sc. in Computer Science and Engineering',
    institution: 'Jagannath University, Bangladesh',
  },
  {
    degree: 'M.Sc. in Automotive Software Engineering',
    institution: 'Technical University of Chemnitz, Germany',
  },
]

function DeveloperPage() {
  return (
    <div className="page-stack">
      <section className="developer-hero">
        <div className="developer-hero-photo-wrap">
          <img className="developer-hero-photo" src="/images/dev.jpeg" alt="Maruf H." />
        </div>
        <div className="developer-hero-copy">
          <p className="section-eyebrow developer-fade" style={{ '--delay': '0ms' }}>
            Developer
          </p>
          <h2 className="developer-hero-title developer-fade" style={{ '--delay': '80ms' }}>
            Hi, I&apos;m Maruf H.
          </h2>
          <p className="developer-hero-role developer-fade" style={{ '--delay': '160ms' }}>
            Lead Web Develper - Bloxley
          </p>
          <p className="developer-hero-location developer-fade" style={{ '--delay': '220ms' }}>
            {icons.location}
            Chemnitz, Germany
          </p>
          <div className="developer-icon-row developer-fade" style={{ '--delay': '300ms' }}>
            <a
              className="developer-icon-btn"
              href="https://github.com/MarufAlAslam"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              {icons.github}
            </a>
            <a
              className="developer-icon-btn"
              href="https://www.linkedin.com/in/webdevmaruf/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              {icons.linkedin}
            </a>
            <a className="developer-icon-btn" href="mailto:marufalaslam@gmail.com" aria-label="Email">
              {icons.mail}
            </a>
            <a className="developer-icon-btn" href="tel:+8801724783655" aria-label="Phone">
              {icons.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="panel developer-education-panel">
        <p className="section-eyebrow">Education</p>
        <h2>Academic Background</h2>
        <div className="developer-education-list">
          {education.map((item) => (
            <article className="developer-education-item" key={item.degree}>
              <span className="developer-education-icon">{icons.cap}</span>
              <div>
                <h3>{item.degree}</h3>
                <p>{item.institution}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DeveloperPage
