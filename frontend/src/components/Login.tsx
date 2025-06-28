import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  
  const { user, isLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  // Redirect authenticated users based on onboarding status
  useEffect(() => {
    if (!isLoading && user) {
      if (user.is_onboarded) {
        navigate('/')
      } else {
        navigate('/onboarding')
      }
    }
  }, [user, isLoading, navigate])

  // If still loading or user is authenticated, show loading or redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500">
        <div className="card bg-white/90 backdrop-blur-sm shadow-2xl">
          <div className="card-body items-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/70 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500">
        <div className="card bg-white/90 backdrop-blur-sm shadow-2xl">
          <div className="card-body items-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/70 mt-2">Redirecting...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setEmailSent(true)
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Email verification sent success screen
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-4">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="card bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20">
            <div className="card-body p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-6 w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-base-content mb-4">
                Check Your Email
              </h2>
              
              <p className="text-base-content/70 mb-6">
                We've sent a verification link to
              </p>
              
              <div className="bg-base-200/50 rounded-lg p-3 mb-6">
                <p className="font-medium text-base-content">{email}</p>
              </div>
              
              <div className="text-left space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">1</span>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Click the verification link in your email
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">2</span>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Complete your profile setup
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">3</span>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Start connecting with skill partners
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  className="btn btn-primary btn-lg w-full"
                  onClick={() => {
                    setEmailSent(false)
                    setIsSignUp(false)
                    setEmail('')
                    setPassword('')
                  }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In Instead
                </button>
                
                <button 
                  className="btn btn-ghost w-full"
                  onClick={async () => {
                    setLoading(true)
                    try {
                      const { error } = await signUp(email, password)
                      if (error) {
                        setError(error.message)
                        setEmailSent(false)
                      }
                    } catch (err) {
                      setError('Failed to resend email')
                      setEmailSent(false)
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Resending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend Email
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 p-4 bg-info/10 rounded-lg">
                <div className="flex items-center gap-2 text-info mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-sm">Didn't receive the email?</span>
                </div>
                <p className="text-xs text-base-content/60">
                  Check your spam folder or try resending the verification email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="card bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20">
          <div className="card-body p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="avatar placeholder mb-4">
                <div className="bg-gradient-to-r from-primary to-secondary text-primary-content rounded-full w-16">
                  <span className="text-2xl">🤝</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SkillSwap
              </h1>
              <p className="text-base-content/60 mt-2">
                Connect. Learn. Share Skills.
              </p>
            </div>

            <div className="tabs tabs-boxed bg-base-200/50 mb-6">
              <button 
                className={`tab flex-1 transition-all duration-200 text-base-content ${!isSignUp ? 'tab-active' : ''}`}
                onClick={() => setIsSignUp(false)}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>
              <button 
                className={`tab flex-1 transition-all duration-200 text-base-content ${isSignUp ? 'tab-active' : ''}`}
                onClick={() => setIsSignUp(true)}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-base-content">Email Address</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="input input-bordered w-full pl-10 bg-white/50 backdrop-blur-sm border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-base-content placeholder:text-base-content/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-base-content">Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="input input-bordered w-full pl-10 bg-white/50 backdrop-blur-sm border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-base-content placeholder:text-base-content/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error shadow-lg animate-pulse">
                  <svg className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control mt-8">
                <button 
                  type="submit" 
                  className={`btn btn-primary btn-lg w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      {isSignUp ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Create Account
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Sign In
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>

            {!isSignUp && (
              <div className="text-center mt-4">
                <button className="link link-primary text-sm hover:link-hover">
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="text-center mt-6 text-sm text-base-content/60">
              {isSignUp ? (
                <p>
                  By signing up, you agree to our{' '}
                  <button className="link link-primary">Terms of Service</button>{' '}
                  and{' '}
                  <button className="link link-primary">Privacy Policy</button>
                </p>
              ) : (
                <p>
                  New to SkillSwap?{' '}
                  <button 
                    className="link link-primary font-medium"
                    onClick={() => setIsSignUp(true)}
                    disabled={loading}
                  >
                    Join our community
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/90">
          <p className="text-sm">
            🌟 Join thousands of learners sharing skills worldwide
          </p>
        </div>
      </div>
    </div>
  )
} 