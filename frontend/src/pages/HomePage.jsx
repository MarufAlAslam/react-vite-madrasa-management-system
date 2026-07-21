import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import HeroCarousel from '../components/common/HeroCarousel'

const programs = [
  {
    id: 1,
    title: 'Dakhil',
    text: 'Secondary-level education (equivalent to SSC) under the Bangladesh Madrasah Education Board.',
  },
  {
    id: 2,
    title: 'Alim',
    text: 'Higher secondary-level education (equivalent to HSC) in Science, Business Studies, and Humanities.',
  },
  {
    id: 3,
    title: 'Fazil',
    text: 'Degree-level Islamic higher education, the institution’s namesake and highest offered program.',
  },
]

const instituteFacts = [
  { label: 'Founded', value: '1935' },
  { label: 'EIIN', value: '101165' },
  { label: 'Students', value: '1,481' },
  { label: 'Teachers', value: '28' },
]

function HomePage() {
  const { notices, loading } = useData()

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <div>
          <p className="section-eyebrow">Welcome to Moulovirhat H. Fazil Madrasah</p>
          <h2 className="hero-title">Serving Islamic Education in Bhola Since 1935</h2>
          <p>
            A government-recognized Fazil-level madrasah in Bhola, Barisal, offering Dakhil, Alim, and Fazil
            education across Science, Business Studies, and Humanities.
          </p>
          <div className="hero-actions">
            <Link className="cta-btn" to="/notice">
              View Notices
            </Link>
            <Link className="ghost-link" to="/gallery">
              View Gallery
            </Link>
          </div>
        </div>
        <div className="hero-image-wrap">
          <HeroCarousel />
        </div>
      </section>

      <section className="panel about-panel">
        <div className="about-image-wrap">
          <img src="/images/img-4.jpg" alt="Moulovirhat H. Fazil Madrasah campus" />
        </div>
        <article>
          <p className="section-eyebrow">About Our Madrasah</p>
          <h2>Established 1935, Recognized 1953</h2>
          <p>
            Moulovirhat H. Fazil Madrasah (EIIN: 101165) is a government-recognized Fazil-level madrasah located
            in Bhola, Barisal Division. Founded on 1 March 1935 and officially recognized on 5 August 1953, the
            institution operates under the Bangladesh Madrasah Education Board with Bangla-medium, day-shift
            instruction across Science, Business Studies, and Humanities.
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="stats-grid">
          {instituteFacts.map((fact) => (
            <div className="stat-card" key={fact.label}>
              <p>{fact.label}</p>
              <h3>{fact.value}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-headline-row">
          <div>
            <p className="section-eyebrow">Our Programs</p>
            <h2>Learning Tracks</h2>
          </div>
        </div>
        <div className="program-grid">
          {programs.map((program) => (
            <article className="program-card" key={program.id}>
              <h3>{program.title}</h3>
              <p>{program.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-headline-row">
          <div>
            <p className="section-eyebrow">Quick Notice</p>
            <h2>Latest Announcements</h2>
          </div>
          <Link className="ghost-link" to="/notice">
            See All Notices
          </Link>
        </div>
        <div className="notice-grid">
          {!loading &&
            notices.slice(0, 3).map((notice) => (
              <article key={notice.id} className="notice-card">
                <p className="notice-date">{notice.date}</p>
                <h3>{notice.title}</h3>
                <p>{notice.short}</p>
              </article>
            ))}
          {loading && <div className="empty-state">Loading notices...</div>}
          {!loading && notices.length === 0 && (
            <div className="empty-state">No notices published yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
