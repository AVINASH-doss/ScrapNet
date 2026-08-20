import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import UserDashboard from './pages/user/UserDashboard'
import ScrapperDashboard from './pages/scrapper/ScrapperDashboard'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth (redirect if already logged in) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/auth" element={<AuthPage />} />
          </Route>

          {/* User Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/listings" element={<UserDashboard />} />
            <Route path="/user/listings/new" element={<UserDashboard />} />
            <Route path="/user/profile" element={<UserDashboard />} />
            <Route path="/user/notifications" element={<UserDashboard />} />
          </Route>

          {/* Scrapper Routes */}
          <Route element={<ProtectedRoute allowedRoles={['scrapper']} />}>
            <Route path="/scrapper/dashboard" element={<ScrapperDashboard />} />
            <Route path="/scrapper/discover" element={<ScrapperDashboard />} />
            <Route path="/scrapper/offers" element={<ScrapperDashboard />} />
            <Route path="/scrapper/pickups" element={<ScrapperDashboard />} />
            <Route path="/scrapper/profile" element={<ScrapperDashboard />} />
            <Route path="/scrapper/notifications" element={<ScrapperDashboard />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
