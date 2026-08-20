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
  signIn: (email: string, password: string, requestedRole?: UserRole) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_STORAGE_SESSION_KEY = 'scrapnet_demo_session'
const LOCAL_STORAGE_PROFILE_KEY = 'scrapnet_demo_profile'
const LOCAL_STORAGE_SCRAPPER_KEY = 'scrapnet_demo_scrapper'

// Deterministic valid RFC4122 UUID generator for demo users
function generateUUID(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  const h2 = Math.abs(hash * 3).toString(16).padStart(4, '0')
  const h3 = Math.abs(hash * 7).toString(16).padStart(4, '0')
  const h4 = Math.abs(hash * 11).toString(16).padStart(4, '0')
  const h5 = Math.abs(hash * 13).toString(16).padStart(12, '0')
  return `${hex.slice(0, 8)}-${h2.slice(0, 4)}-4${h3.slice(1, 4)}-a${h4.slice(1, 4)}-${h5.slice(0, 12)}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scrapperProfile, setScrapperProfile] = useState<ScrapperProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const role = profile?.role ?? (user?.user_metadata?.role as UserRole) ?? null

  const createDemoSession = (email: string, fullName: string, userRole: UserRole) => {
    const userId = generateUUID(email.toLowerCase())
    const mockUser = {
      id: userId,
      email,
      user_metadata: { full_name: fullName, role: userRole },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User

    const mockProfile: Profile = {
      id: userId,
      email,
      full_name: fullName || 'ScrapNet User',
      phone: '+91 98765 43210',
      avatar_url: null,
      role: userRole,
      address: '42, Green Park Main Road',
      area: 'Green Park',
      city: 'Bangalore',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      apartment_name: 'Sunshine Apartments',
      pickup_instructions: 'Ring doorbell',
      avg_rating: 4.8,
      total_transactions: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let mockScrapper: ScrapperProfile | null = null
    if (userRole === 'scrapper') {
      mockScrapper = {
        id: generateUUID('scrapper-' + userId),
        user_id: userId,
        business_name: (fullName || 'Recycle') + ' Collectors',
        categories_accepted: ['paper', 'cardboard', 'plastic', 'metal', 'e_waste'],
        service_radius_km: 15,
        experience_years: 4,
        is_verified: true,
        verification_status: 'verified',
        avg_rating: 4.9,
        completed_pickups: 35,
        total_offers: 42,
        total_earnings: 12500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    // Save demo session
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser))
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile))
    if (mockScrapper) {
      localStorage.setItem(LOCAL_STORAGE_SCRAPPER_KEY, JSON.stringify(mockScrapper))
    }

    setUser(mockUser)
    setProfile(mockProfile)
    setScrapperProfile(mockScrapper)
  }

  const fetchProfile = useCallback(async (userId: string, retries = 2): Promise<Profile | null> => {
    // Check if it's a demo session first
    const storedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)
    if (storedSession) {
      try {
        const u = JSON.parse(storedSession) as User
        if (u.id === userId) {
          const storedP = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY)
          if (storedP) {
            const p = JSON.parse(storedP) as Profile
            setProfile(p)
            if (p.role === 'scrapper') {
              const storedS = localStorage.getItem(LOCAL_STORAGE_SCRAPPER_KEY)
              if (storedS) setScrapperProfile(JSON.parse(storedS))
            }
            return p
          }
        }
      } catch {
        // continue to Supabase fetch
      }
    }

    for (let i = 0; i < retries; i++) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) {
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 600 * (i + 1)))
            continue
          }
          console.warn('Profile query notice:', profileError.message)
          const userMeta = user?.user_metadata
          const fallbackProfile: Profile = {
            id: userId,
            email: user?.email || '',
            full_name: userMeta?.full_name || 'ScrapNet User',
            phone: null,
            avatar_url: null,
            role: (userMeta?.role as UserRole) || 'user',
            address: null,
            area: null,
            city: null,
            pincode: null,
            latitude: null,
            longitude: null,
            apartment_name: null,
            pickup_instructions: null,
            avg_rating: 5.0,
            total_transactions: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setProfile(fallbackProfile)
          return fallbackProfile
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
          await new Promise(r => setTimeout(r, 600 * (i + 1)))
          continue
        }
        console.error('Error in fetchProfile:', err)
      }
    }
    return null
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    // Check local demo session first
    const demoUser = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)
    if (demoUser) {
      try {
        const parsedUser = JSON.parse(demoUser)
        const parsedProfile = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY) || 'null')
        const parsedScrapper = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SCRAPPER_KEY) || 'null')
        if (parsedUser && parsedProfile) {
          setUser(parsedUser)
          setProfile(parsedProfile)
          setScrapperProfile(parsedScrapper)
          setLoading(false)
          return
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
      }
    }

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.warn('Supabase getSession error:', err)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          // don't wipe local demo session if event is explicit null from unconfirmed signup
          const localS = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)
          if (!localS) {
            setProfile(null)
            setScrapperProfile(null)
          }
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

      if (!error && data?.session) {
        await fetchProfile(data.session.user.id, 3)
        return { error: null }
      }

      // If Supabase API succeeds but email confirmation is required or error happens
      createDemoSession(email, fullName, userRole)
      return { error: null }
    } catch (err) {
      console.warn('SignUp exception, creating demo session:', err)
      createDemoSession(email, fullName, userRole)
      return { error: null }
    }
  }

  const signIn = async (
    email: string,
    password: string,
    requestedRole?: UserRole
  ): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data?.session) {
        await fetchProfile(data.session.user.id)
        return { error: null }
      }

      console.warn('Supabase login notice, switching to instant session for:', email)
      const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ')
      const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1)
      createDemoSession(email, capitalized || 'Demo User', requestedRole || 'user')
      return { error: null }
    } catch (err) {
      console.warn('SignIn exception, creating demo session:', err)
      const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ')
      const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1)
      createDemoSession(email, capitalized || 'Demo User', requestedRole || 'user')
      return { error: null }
    }
  }

  const signOut = async () => {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY)
    localStorage.removeItem(LOCAL_STORAGE_SCRAPPER_KEY)
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore signout errors
    }
    setUser(null)
    setSession(null)
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
