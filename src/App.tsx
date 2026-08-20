import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute'
import { Loader2 } from 'lucide-react'

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'))
const UserProfile = lazy(() => import('./pages/user/UserProfile'))
const UserListings = lazy(() => import('./pages/user/UserListings'))
const UserPickups = lazy(() => import('./pages/user/UserPickups'))
const CreateListing = lazy(() => import('./pages/user/CreateListing'))
const ScrapperDashboard = lazy(() => import('./pages/scrapper/ScrapperDashboard'))
const ScrapperProfile = lazy(() => import('./pages/scrapper/ScrapperProfile'))
const ScrapperDiscover = lazy(() => import('./pages/scrapper/ScrapperDiscover'))
const ScrapperOffers = lazy(() => import('./pages/scrapper/ScrapperOffers'))
const ScrapperPickups = lazy(() => import('./pages/scrapper/ScrapperPickups'))
const ListingDetail = lazy(() => import('./pages/shared/ListingDetail'))
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/auth" element={<AuthPage />} />
            </Route>

            {/* User */}
            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/listings" element={<UserListings />} />
              <Route path="/user/listings/new" element={<CreateListing />} />
              <Route path="/user/listings/:id" element={<ListingDetail />} />
              <Route path="/user/pickups" element={<UserPickups />} />
              <Route path="/user/profile" element={<UserProfile />} />
              <Route path="/user/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Scrapper */}
            <Route element={<ProtectedRoute allowedRoles={['scrapper']} />}>
              <Route path="/scrapper/dashboard" element={<ScrapperDashboard />} />
              <Route path="/scrapper/discover" element={<ScrapperDiscover />} />
              <Route path="/scrapper/listings/:id" element={<ListingDetail />} />
              <Route path="/scrapper/offers" element={<ScrapperOffers />} />
              <Route path="/scrapper/pickups" element={<ScrapperPickups />} />
              <Route path="/scrapper/profile" element={<ScrapperProfile />} />
              <Route path="/scrapper/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
