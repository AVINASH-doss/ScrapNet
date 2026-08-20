import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, ScrapperProfile, UserRole } from '../types/database'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  scrapperProfile: ScrapperProfile | null
  role: UserRole | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scrapperProfile, setScrapperProfile] = useState<ScrapperProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const role = profile?.role ?? (user?.user_metadata?.role as UserRole) ?? null

  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<Profile | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) {
          // Profile might not be created yet (trigger delay), retry after short wait
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 800 * (i + 1)))
            continue
          }
          console.error('Error fetching profile:', profileError)
          return null
        }

        const typedProfile = profileData as unknown as Profile
        setProfile(typedProfile)

        if (typedProfile?.role === 'scrapper') {
          const { data: scrapperData } = await supabase
            .from('scrapper_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

          setScrapperProfile(scrapperData as unknown as ScrapperProfile)
        }

        return typedProfile
      } catch (err) {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 800 * (i + 1)))
          continue
        }
        console.error('Error in fetchProfile:', err)
      }
    }
    return null
  }, [])


  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
          setScrapperProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    userRole: UserRole
  ): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: userRole,
          },
        },
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('rate limit')) {
          return { error: 'Too many attempts. Please wait a minute and try again.' }
        }
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          return { error: 'This email is already registered. Try signing in instead.' }
        }
        if (error.message.includes('email_address_invalid') || error.message.includes('invalid')) {
          return { error: 'Please enter a valid email address.' }
        }
        return { error: error.message }
      }

      // Supabase with email confirmation disabled returns a session immediately.
      // With email confirmation enabled, data.session will be null.
      if (data?.session) {
        // Auto-confirmed — wait for profile to be created by the DB trigger
        await fetchProfile(data.session.user.id, 5)
        return { error: null }
      }

      // Email confirmation required
      if (data?.user && !data.session) {
        return { error: 'Please check your email to confirm your account, then sign in.' }
      }

      return { error: null }
    } catch (err) {
      console.error('SignUp error:', err)
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password. Please check and try again.' }
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Please check your email and confirm your account first.' }
        }
        if (error.message.includes('rate limit')) {
          return { error: 'Too many login attempts. Please wait a minute.' }
        }
        return { error: error.message }
      }

      if (data?.session) {
        await fetchProfile(data.session.user.id)
      }

      return { error: null }
    } catch (err) {
      console.error('SignIn error:', err)
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setScrapperProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        scrapperProfile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
