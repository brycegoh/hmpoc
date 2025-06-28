import { Routes, Route } from 'react-router'
import { ProtectedRoute } from './components'
import { Login, Dashboard, OnboardingForm } from './components'
import './App.css'

export interface RouteConfig {
  path: string
  element: React.JSX.Element
  protected?: boolean
}

export const routes: RouteConfig[] = [
  {
    path: '/login',
    element: <Login />,
    protected: false,
  },
  {
    path: '/onboarding',
    element: <OnboardingForm />,
    protected: true,
  },
  {
    path: '/',
    element: <Dashboard />,
    protected: true,
  },
] 

function App() {
  return (
    <Routes>
      {routes.map(({ path, element, protected: isProtected }) => (
        <Route
          key={path}
          path={path}
          element={
            isProtected ? (
              <ProtectedRoute>
                {element}
              </ProtectedRoute>
            ) : (
              element
            )
          }
        />
      ))}
    </Routes>
  )
}

export default App