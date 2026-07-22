import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RequireSuperAdmin() {
  const { isSuperAdmin } = useAuth()

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard/teachers" replace />
  }

  return <Outlet />
}

export default RequireSuperAdmin
