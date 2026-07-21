import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import NoticePage from './pages/NoticePage'
import TeachersPage from './pages/TeachersPage'

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
            <Route path="admin/login" element={<AdminLoginPage />} />
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
