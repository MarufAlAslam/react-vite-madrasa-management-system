import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RequireTeacher() {
  const { isTeacher, homePath } = useAuth()

  if (!isTeacher) {
    return <Navigate to={homePath} replace />
  }

  return <Outlet />
}

export default RequireTeacher
