import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getCurrentUserProfile } from '../services/users'

interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  birthdate: string | null
  gender: string | null
  tz_name: string | null
  created_at: string
  updated_at: string
  is_onboarded: boolean
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserProfile = async () => {
    try {
      const data = await getCurrentUserProfile()
      setUser(data.user)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    }
  }

  const refreshUserProfile = async () => {
    if (session) {
      setIsLoading(true)
      await fetchUserProfile()
      setIsLoading(false)
    }
  }

  // Initialize session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle session changes
  useEffect(() => {
    const handleSessionChange = async () => {
      if (session) {
        await fetchUserProfile()
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    handleSessionChange()
  }, [session])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 