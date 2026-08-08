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
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/teachers" className={tabClassName}>
              Add Teacher
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/classes" className={tabClassName}>
              Manage Classes
            </NavLink>
          )}
          <NavLink to="/admin/dashboard/students" end className={tabClassName}>
            Add Student
          </NavLink>
          <NavLink to="/admin/dashboard/students/list" className={tabClassName}>
            Student List
          </NavLink>
          <NavLink to="/admin/dashboard/results" className={tabClassName}>
            Results
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
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/exams" className={tabClassName}>
              Exams
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/admit-cards" className={tabClassName}>
              Admit Cards
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/admin/dashboard/settings" className={tabClassName}>
              Institution Assets
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
