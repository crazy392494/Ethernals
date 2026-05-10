import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import TripsPage from './pages/TripsPage'
import CreateTripPage from './pages/CreateTripPage'
import TripDetailPage from './pages/TripDetailPage'
import ItineraryBuilderPage from './pages/ItineraryBuilderPage'
import BudgetPage from './pages/BudgetPage'
import PackingPage from './pages/PackingPage'
import NotesPage from './pages/NotesPage'
import CitiesPage from './pages/CitiesPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import SharedTripPage from './pages/SharedTripPage'
import NotFoundPage from './pages/NotFoundPage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public share link */}
      <Route path="/shared/:token" element={<SharedTripPage />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
      </Route>

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/new" element={<CreateTripPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/trips/:id/edit" element={<CreateTripPage />} />
        <Route path="/trips/:id/itinerary" element={<ItineraryBuilderPage />} />
        <Route path="/trips/:id/budget" element={<BudgetPage />} />
        <Route path="/trips/:id/packing" element={<PackingPage />} />
        <Route path="/trips/:id/notes" element={<NotesPage />} />
        <Route path="/cities" element={<CitiesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
