import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import RequireSuperAdmin from './components/common/RequireSuperAdmin'
import AdminLayout from './components/layout/AdminLayout'
import MainLayout from './components/layout/MainLayout'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { DataProvider } from './context/DataContext'
import AdminAdminsPage from './pages/admin/AdminAdminsPage'
import AdminAdmitCardsPage from './pages/admin/AdminAdmitCardsPage'
import AdminClassesPage from './pages/admin/AdminClassesPage'
import AdminExamsPage from './pages/admin/AdminExamsPage'
import AdminExportPage from './pages/admin/AdminExportPage'
import AdminFinancePage from './pages/admin/AdminFinancePage'
import AdminGalleryPage from './pages/admin/AdminGalleryPage'
import AdminLogsPage from './pages/admin/AdminLogsPage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminResultsPage from './pages/admin/AdminResultsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminStaffEditPage from './pages/admin/AdminStaffEditPage'
import AdminStaffListPage from './pages/admin/AdminStaffListPage'
import AdminStaffPage from './pages/admin/AdminStaffPage'
import AdminStudentDetailPage from './pages/admin/AdminStudentDetailPage'
import AdminStudentEditPage from './pages/admin/AdminStudentEditPage'
import AdminStudentListPage from './pages/admin/AdminStudentListPage'
import AdminStudentsPage from './pages/admin/AdminStudentsPage'
import AdminTeacherEditPage from './pages/admin/AdminTeacherEditPage'
import AdminTeacherListPage from './pages/admin/AdminTeacherListPage'
import AdminTeacherProfilePage from './pages/admin/AdminTeacherProfilePage'
import AdminTeachersPage from './pages/admin/AdminTeachersPage'
import AdminLoginPage from './pages/AdminLoginPage'
import DeveloperPage from './pages/DeveloperPage'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import NoticePage from './pages/NoticePage'
import StaffPage from './pages/StaffPage'
import StudentsPage from './pages/StudentsPage'
import TeachersPage from './pages/TeachersPage'

function AdminIndexRedirect() {
  const { isSuperAdmin } = useAuth()
  return <Navigate to={isSuperAdmin ? '/admin/dashboard/overview' : '/admin/dashboard/students'} replace />
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ConfirmProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="notice" element={<NoticePage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="developer" element={<DeveloperPage />} />
              <Route path="admin/login" element={<AdminLoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminIndexRedirect />} />
              <Route path="students" element={<AdminStudentsPage />} />
              <Route path="students/list" element={<AdminStudentListPage />} />
              <Route path="results" element={<AdminResultsPage />} />
              <Route path="students/:id" element={<AdminStudentDetailPage />} />
              <Route element={<RequireSuperAdmin />}>
                <Route path="overview" element={<AdminOverviewPage />} />
                <Route path="finance" element={<AdminFinancePage />} />
                <Route path="teachers" element={<AdminTeachersPage />} />
                <Route path="teachers/list" element={<AdminTeacherListPage />} />
                <Route path="classes" element={<AdminClassesPage />} />
                <Route path="gallery" element={<AdminGalleryPage />} />
                <Route path="admins" element={<AdminAdminsPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="export" element={<AdminExportPage />} />
                <Route path="admit-cards" element={<AdminAdmitCardsPage />} />
                <Route path="exams" element={<AdminExamsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="staff" element={<AdminStaffPage />} />
                <Route path="staff/list" element={<AdminStaffListPage />} />
                <Route path="staff/:id/edit" element={<AdminStaffEditPage />} />
                <Route path="teachers/:id/edit" element={<AdminTeacherEditPage />} />
                <Route path="teachers/:id" element={<AdminTeacherProfilePage />} />
                <Route path="students/:id/edit" element={<AdminStudentEditPage />} />
              </Route>
            </Route>
          </Routes>
        </ConfirmProvider>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
