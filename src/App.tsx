import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'

// User Pages
import UserDashboard from './pages/user/UserDashboard'
import UserProfile from './pages/user/UserProfile'
import UserListings from './pages/user/UserListings'
import CreateListing from './pages/user/CreateListing'

// Scrapper Pages
import ScrapperDashboard from './pages/scrapper/ScrapperDashboard'
import ScrapperProfile from './pages/scrapper/ScrapperProfile'
import ScrapperDiscover from './pages/scrapper/ScrapperDiscover'

// Shared Pages
import ListingDetail from './pages/shared/ListingDetail'
import NotificationsPage from './pages/shared/NotificationsPage'

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
            <Route path="/user/listings" element={<UserListings />} />
            <Route path="/user/listings/new" element={<CreateListing />} />
            <Route path="/user/listings/:id" element={<ListingDetail />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Scrapper Routes */}
          <Route element={<ProtectedRoute allowedRoles={['scrapper']} />}>
            <Route path="/scrapper/dashboard" element={<ScrapperDashboard />} />
            <Route path="/scrapper/discover" element={<ScrapperDiscover />} />
            <Route path="/scrapper/listings/:id" element={<ListingDetail />} />
            <Route path="/scrapper/offers" element={<ScrapperDashboard />} />
            <Route path="/scrapper/pickups" element={<ScrapperDashboard />} />
            <Route path="/scrapper/profile" element={<ScrapperProfile />} />
            <Route path="/scrapper/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
