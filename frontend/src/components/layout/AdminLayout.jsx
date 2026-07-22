import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function tabClassName({ isActive }) {
  return `admin-tab-button ${isActive ? 'active' : ''}`
}

function AdminLayout() {
  const { logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="page-stack">
      <section className="panel admin-workspace">
        <p className="section-eyebrow">Admin Panel</p>
        <h2>Management Console</h2>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/overview" className={tabClassName}>
              Dashboard
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/finance" className={tabClassName}>
              Income & Expenses
            </NavLink>
          )}
          <NavLink to="/admin/dashboard/teachers" className={tabClassName}>
            Add Teacher
          </NavLink>
          <NavLink to="/admin/dashboard/students" className={tabClassName}>
            Add Student
          </NavLink>
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/gallery" className={tabClassName}>
              Update Gallery
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/admins" className={tabClassName}>
              Create Admin
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/logs" className={tabClassName}>
              Activity Log
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/export" className={tabClassName}>
              Export Data
            </NavLink>
          )}
          <button type="button" className="admin-tab-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </section>

      <Outlet />
    </div>
  )
}

export default AdminLayout
