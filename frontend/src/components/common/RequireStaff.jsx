import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Admin and staff pages; teacher logins are sent to their own page.
function RequireStaff() {
  const { isTeacher, homePath } = useAuth()

  if (isTeacher) {
    return <Navigate to={homePath} replace />
  }

  return <Outlet />
}

export default RequireStaff
