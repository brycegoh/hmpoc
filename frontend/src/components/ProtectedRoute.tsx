import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check if we're on the onboarding page
  const isOnboardingPage = location.pathname === '/onboarding'

  if (!isOnboardingPage && !user.is_onboarded) {
    return <Navigate to="/onboarding" replace/>
  }

  return <>{children}</>
} 