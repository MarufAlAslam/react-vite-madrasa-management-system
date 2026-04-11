import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function MainLayout() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand-block">
          <div className="logo-mark" aria-hidden="true">
            M
          </div>
          <div>
            <h1>Darul Noor Madrasa</h1>
            <p className="tagline">Nurturing Knowledge, Character, and Faith</p>
          </div>
        </div>
      </header>

      <nav className="main-nav" aria-label="Primary navigation">
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
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
