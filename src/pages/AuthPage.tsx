import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import type { UserRole } from '../types/database'
import {
  Recycle, Mail, Lock, User, ArrowRight, Eye, EyeOff,
  Truck, Home, Loader2, ChevronDown
} from 'lucide-react'

type AuthMode = 'login' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [roleTab, setRoleTab] = useState<UserRole>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signIn, signUp } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          showToast('error', 'Name is required')
          setIsSubmitting(false)
          return
        }
        if (password.length < 6) {
          showToast('error', 'Password must be at least 6 characters')
          setIsSubmitting(false)
          return
        }

        const { error } = await signUp(email, password, fullName, roleTab)
        if (error) {
          showToast('error', 'Sign up failed', error)
        } else {
          showToast('success', 'Account created!', 'Welcome to ScrapNet.')
          const redirectPath = from ?? (roleTab === 'scrapper' ? '/scrapper/dashboard' : '/user/dashboard')
          navigate(redirectPath, { replace: true })
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          showToast('error', 'Login failed', error)
        } else {
          showToast('success', 'Welcome back!')
          // Role-based redirect handled by auth state change + protected routes
          // but we can also force a navigation if we know the path
          if (from) {
            navigate(from, { replace: true })
          }
          // The auth state change will trigger a redirect through ProtectedRoute/PublicOnlyRoute
        }
      }
    } catch {
      showToast('error', 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Recycle className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ScrapNet</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Your scrap has value.
          </h1>
          <p className="text-xl text-brand-200 leading-relaxed mb-12">
            We bring the right collector to your doorstep.
            Compare offers, schedule pickups, and contribute to a cleaner planet.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: '📦', text: 'Post your scrap in seconds' },
              { icon: '💰', text: 'Get competitive offers from verified collectors' },
              { icon: '🔒', text: 'Your privacy is protected until you accept' },
              { icon: '⭐', text: 'Rate and review for trust & transparency' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-brand-100">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-lg">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">ScrapNet</span>
          </div>

          {/* Role Toggle */}
          <div className="bg-surface-100 rounded-2xl p-1 flex mb-8">
            <button
              type="button"
              onClick={() => setRoleTab('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                roleTab === 'user'
                  ? 'bg-white text-brand-700 shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Home className="w-4 h-4" />
              Household
            </button>
            <button
              type="button"
              onClick={() => setRoleTab('scrapper')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                roleTab === 'scrapper'
                  ? 'bg-white text-brand-700 shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Truck className="w-4 h-4" />
              Scrapper
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-text-secondary mt-1">
              {mode === 'login'
                ? `Sign in to your ${roleTab === 'scrapper' ? 'collector' : 'household'} account`
                : `Join ScrapNet as a ${roleTab === 'scrapper' ? 'scrap collector' : 'household user'}`
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-fullname" className="block text-sm font-medium text-text-primary mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    id="auth-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={roleTab === 'scrapper' ? 'Business or full name' : 'Your full name'}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-surface-200 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-surface-200 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-text-primary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                  className="w-full pl-11 pr-12 py-3 bg-white border border-surface-200 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-brand text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-1 text-brand-600 font-semibold hover:text-brand-700 transition-colors cursor-pointer"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Scrapper callout for users */}
          {roleTab === 'user' && (
            <div className="mt-8 pt-6 border-t border-surface-200 text-center">
              <p className="text-text-secondary text-sm mb-2">Are you a scrap collector?</p>
              <button
                type="button"
                onClick={() => setRoleTab('scrapper')}
                className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm hover:text-brand-700 transition-colors cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                Login / Sign up as Scrapper
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          )}

          {roleTab === 'scrapper' && (
            <div className="mt-8 pt-6 border-t border-surface-200 text-center">
              <p className="text-text-secondary text-sm mb-2">Not a collector?</p>
              <button
                type="button"
                onClick={() => setRoleTab('user')}
                className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm hover:text-brand-700 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Continue as Household
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
