import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function navLinkClass({ isActive }) {
  return `admin-nav-link ${isActive ? 'active' : ''}`
}

function AdminLayout() {
  const { user, logout, isSuperAdmin, isTeacher } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false)
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const navGroups = [
    {
      title: 'My Work',
      items: [
        { to: '/admin/dashboard/my-results', label: 'Enter Results', show: isTeacher },
        { to: '/admin/dashboard/change-password', label: 'Change Password', show: isTeacher },
      ],
    },
    {
      title: 'Dashboard',
      items: [{ to: '/admin/dashboard/overview', label: 'Dashboard', show: isSuperAdmin }],
    },
    {
      title: 'Students',
      items: [
        { to: '/admin/dashboard/students', label: 'Add Student', end: true, show: !isTeacher },
        { to: '/admin/dashboard/students/list', label: 'Student List', show: !isTeacher },
        { to: '/admin/dashboard/results', label: 'Results', end: true, show: !isTeacher },
        { to: '/admin/dashboard/results/class', label: 'Class Result Sheet', show: !isTeacher },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/admin/dashboard/classes', label: 'Classes', show: isSuperAdmin },
        { to: '/admin/dashboard/exams', label: 'Exams', show: isSuperAdmin },
        { to: '/admin/dashboard/seat-plan', label: 'Seat Plan', show: isSuperAdmin },
        { to: '/admin/dashboard/admit-cards', label: 'Admit Cards', show: isSuperAdmin },
        { to: '/admin/dashboard/teachers', label: 'Add Teacher', end: true, show: isSuperAdmin },
        { to: '/admin/dashboard/teachers/list', label: 'Teacher List', show: isSuperAdmin },
        { to: '/admin/dashboard/teachers/access', label: 'Teacher Access', show: isSuperAdmin },
      ],
    },
    {
      title: 'Finance',
      items: [{ to: '/admin/dashboard/finance', label: 'Income & Expenses', show: isSuperAdmin }],
    },
    {
      title: 'Office',
      items: [
        { to: '/admin/dashboard/staff', label: 'Add Staff', end: true, show: isSuperAdmin },
        { to: '/admin/dashboard/staff/list', label: 'Staffs', show: isSuperAdmin },
      ],
    },
    {
      title: 'System',
      items: [
        { to: '/admin/dashboard/gallery', label: 'Update Gallery', show: isSuperAdmin },
        { to: '/admin/dashboard/admins', label: 'Create Admin', show: isSuperAdmin },
        { to: '/admin/dashboard/logs', label: 'Activity Log', show: isSuperAdmin },
        { to: '/admin/dashboard/export', label: 'Export Data', show: isSuperAdmin },
        { to: '/admin/dashboard/settings', label: 'Institution Assets', show: isSuperAdmin },
      ],
    },
  ]

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <img className="logo-mark" src="/images/logo.jpg" alt="Moulovirhat H. Fazil Madrasah logo" />
          <span>Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin sections">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.show)
            if (visibleItems.length === 0) return null

            return (
              <div className="admin-nav-group" key={group.title}>
                <p className="admin-nav-group-title">{group.title}</p>
                {visibleItems.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <a className="admin-dev-credit" href="/developer" target="_blank" rel="noreferrer">
          Developer Info
        </a>
      </aside>

      {sidebarOpen && <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-sidebar-toggle"
              aria-label="Toggle admin menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              ☰
            </button>
            <span className="admin-topbar-greeting">Hello, {user?.name}</span>
          </div>

          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
