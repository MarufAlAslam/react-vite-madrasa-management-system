import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function MainLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand-block logo-only">
          <div className="logo-mark logo-large" aria-hidden="true">
            M
          </div>
          <div className="brand-copy">
            <h1>Darul Noor Madrasa</h1>
            <p className="tagline">Islamic education with discipline, character, and service.</p>
          </div>
        </div>

        <button
          type="button"
          className={`burger-btn ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
        <div className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/notice">Notification</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/teachers">Teachers</NavLink>
          <NavLink to="/result">Result</NavLink>
          {isAuthenticated ? (
            <NavLink to="/admin/dashboard" className="nav-right">
              Admin Panel
            </NavLink>
          ) : (
            <NavLink to="/admin/login" className="nav-right">
              Admin Login
            </NavLink>
          )}
        </div>
      </nav>

      {menuOpen && <div className="mobile-nav-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <section>
            <h3>Darul Noor</h3>
            <p>Islamic education with discipline, character, and community service.</p>
          </section>

          <section>
            <h3>Quick Links</h3>
            <div className="footer-links">
              <NavLink to="/notice">Notifications</NavLink>
              <NavLink to="/gallery">Gallery</NavLink>
              <NavLink to="/result">Results</NavLink>
            </div>
          </section>

          <section>
            <h3>Contact</h3>
            <p>Email: info@darulnoor.local</p>
            <p>Phone: +880 1700-000000</p>
          </section>
        </div>
        <p className="footer-bottom">© {new Date().getFullYear()} Darul Noor Madrasa. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default MainLayout
