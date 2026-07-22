import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import RequireSuperAdmin from './components/common/RequireSuperAdmin'
import AdminLayout from './components/layout/AdminLayout'
import MainLayout from './components/layout/MainLayout'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import AdminAdminsPage from './pages/admin/AdminAdminsPage'
import AdminExportPage from './pages/admin/AdminExportPage'
import AdminFinancePage from './pages/admin/AdminFinancePage'
import AdminGalleryPage from './pages/admin/AdminGalleryPage'
import AdminLogsPage from './pages/admin/AdminLogsPage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminStudentEditPage from './pages/admin/AdminStudentEditPage'
import AdminStudentsPage from './pages/admin/AdminStudentsPage'
import AdminTeacherEditPage from './pages/admin/AdminTeacherEditPage'
import AdminTeachersPage from './pages/admin/AdminTeachersPage'
import AdminLoginPage from './pages/AdminLoginPage'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import NoticePage from './pages/NoticePage'
import StudentsPage from './pages/StudentsPage'
import TeachersPage from './pages/TeachersPage'

function AdminIndexRedirect() {
  const { isSuperAdmin } = useAuth()
  return <Navigate to={isSuperAdmin ? '/admin/dashboard/overview' : '/admin/dashboard/teachers'} replace />
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="notice" element={<NoticePage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="admin/login" element={<AdminLoginPage />} />
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminIndexRedirect />} />
              <Route path="teachers" element={<AdminTeachersPage />} />
              <Route path="students" element={<AdminStudentsPage />} />
              <Route element={<RequireSuperAdmin />}>
                <Route path="overview" element={<AdminOverviewPage />} />
                <Route path="finance" element={<AdminFinancePage />} />
                <Route path="gallery" element={<AdminGalleryPage />} />
                <Route path="admins" element={<AdminAdminsPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="export" element={<AdminExportPage />} />
                <Route path="teachers/:id/edit" element={<AdminTeacherEditPage />} />
                <Route path="students/:id/edit" element={<AdminStudentEditPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
