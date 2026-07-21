import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function MainLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand-block logo-only">
          <img className="logo-mark logo-large" src="/images/logo.jpg" alt="Moulovirhat H. Fazil Madrasah logo" />
          <div className="brand-copy">
            <h1>Moulovirhat H. Fazil Madrasah</h1>
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
            <h3>Moulovirhat H. Fazil Madrasah</h3>
            <p>EIIN: 101165 &middot; Established 1935</p>
            <p>Bhola, Barisal Division, Bangladesh</p>
          </section>

          <section>
            <h3>Quick Links</h3>
            <div className="footer-links">
              <NavLink to="/notice">Notifications</NavLink>
              <NavLink to="/gallery">Gallery</NavLink>
              <NavLink to="/teachers">Teachers</NavLink>
            </div>
          </section>

          <section>
            <h3>Contact</h3>
            <p>Email: mhfm1935@yahoo.com</p>
            <p>Phone: +880 1771-656565</p>
          </section>
        </div>
        <p className="footer-bottom">© {new Date().getFullYear()} Moulovirhat H. Fazil Madrasah. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default MainLayout
