import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RequireSuperAdmin() {
  const { isSuperAdmin, homePath } = useAuth()

  if (!isSuperAdmin) {
    return <Navigate to={homePath} replace />
  }

  return <Outlet />
}

export default RequireSuperAdmin
