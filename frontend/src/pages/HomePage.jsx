import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'

const programs = [
  {
    id: 1,
    title: 'Hifz Program',
    text: 'A structured memorization track with daily revision supervision and tajweed correction.',
  },
  {
    id: 2,
    title: 'Alim Curriculum',
    text: 'Core Islamic sciences including tafsir, hadith, fiqh, usul, and Arabic grammar.',
  },
  {
    id: 3,
    title: 'Maktab Foundation',
    text: 'Weekend and evening learning for young students with adab and aqeedah focus.',
  },
]

const prayerTimes = [
  { name: 'Fajr', time: '4:37 AM' },
  { name: 'Dhuhr', time: '12:07 PM' },
  { name: 'Asr', time: '4:38 PM' },
  { name: 'Maghrib', time: '6:19 PM' },
  { name: 'Isha', time: '7:34 PM' },
]

function HomePage() {
  const { notices, loading } = useData()

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-headline-row">
          <div>
            <p className="section-eyebrow">Daily Salah</p>
            <h2>Prayer Timings</h2>
          </div>
        </div>
        <div className="prayer-grid">
          {prayerTimes.map((item) => (
            <div className="prayer-card" key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.time}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel hero-panel">
        <div>
          <p className="section-eyebrow">Welcome to Darul Noor</p>
          <h2 className="hero-title">A Center for Quran, Character, and Community Service</h2>
          <p>
            Our madrasa blends traditional Islamic scholarship with disciplined modern learning so students grow
            in ilm, akhlaq, and leadership.
          </p>
          <div className="hero-actions">
            <Link className="cta-btn" to="/result">
              Check Results
            </Link>
            <Link className="ghost-link" to="/notice">
              View Notices
            </Link>
          </div>
        </div>
        <div className="hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1542816417-0983678cbb7e?auto=format&fit=crop&w=1400&q=80"
            alt="Students reciting Quran"
          />
        </div>
      </section>

      <section className="panel about-panel">
        <div className="about-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1400&q=80"
            alt="Islamic architecture"
          />
        </div>
        <article>
          <p className="section-eyebrow">About Our Madrasa</p>
          <h2>Balanced Tarbiyah and Academic Excellence</h2>
          <p>
            Darul Noor Madrasa is committed to nurturing students with deep Islamic values, strong discipline,
            and meaningful social responsibility. We maintain a learning environment rooted in sunnah, respect,
            and educational quality.
          </p>
        </article>
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
        </div>
      </section>
    </div>
  )
}

export default HomePage
