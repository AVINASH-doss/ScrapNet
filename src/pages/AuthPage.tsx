import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import type { UserRole } from '../types/database'
import {
  Recycle, Mail, Lock, User, ArrowRight, Eye, EyeOff,
  Truck, Home, Loader2, ChevronRight
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
          if (error.includes('check your email')) {
            showToast('info', 'Check your email', error)
          } else {
            showToast('error', 'Sign up failed', error)
          }
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
          setTimeout(() => {
            const redirectPath = from ?? (roleTab === 'scrapper' ? '/scrapper/dashboard' : '/user/dashboard')
            navigate(redirectPath, { replace: true })
          }, 100)
        }
      }
    } catch {
      showToast('error', 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f9fafb' }}>
      {/* Left Panel - Branding */}
      <div style={{
        flex: '1 1 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px',
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #15803d 100%)',
        position: 'relative', overflow: 'hidden',
      }} className="hidden lg:flex">
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Recycle style={{ width: 28, height: 28, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>ScrapNet</span>
          </div>

          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 20 }}>
            Your scrap has <span style={{ color: '#86efac' }}>value.</span>
          </h1>

          <p style={{ fontSize: 18, color: '#bbf7d0', lineHeight: 1.6, marginBottom: 48, maxWidth: 500 }}>
            We bring the right collector to your doorstep. Compare offers, schedule pickups, and contribute to a cleaner planet.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '📦', text: 'Post your scrap in seconds' },
              { icon: '💰', text: 'Get competitive offers from verified collectors' },
              { icon: '🔒', text: 'Your privacy is protected until you accept' },
              { icon: '⭐', text: 'Rate and review for trust & transparency' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{ fontSize: 16, color: '#dcfce7', fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div style={{
        flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', background: '#f9fafb',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }} className="lg:hidden">
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Recycle style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>ScrapNet</span>
          </div>

          {/* Role Selector Tabs */}
          <div style={{
            background: '#e5e7eb', padding: 4, borderRadius: 16,
            display: 'flex', marginBottom: 32, gap: 4,
          }}>
            <button
              type="button"
              onClick={() => setRoleTab('user')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: roleTab === 'user' ? '#fff' : 'transparent',
                color: roleTab === 'user' ? '#15803d' : '#4b5563',
                boxShadow: roleTab === 'user' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Home style={{ width: 16, height: 16 }} /> Household
            </button>
            <button
              type="button"
              onClick={() => setRoleTab('scrapper')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: roleTab === 'scrapper' ? '#fff' : 'transparent',
                color: roleTab === 'scrapper' ? '#15803d' : '#4b5563',
                boxShadow: roleTab === 'scrapper' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Truck style={{ width: 16, height: 16 }} /> Scrapper
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              {mode === 'login'
                ? `Sign in to your ${roleTab === 'scrapper' ? 'collector' : 'household'} account`
                : `Join ScrapNet as a ${roleTab === 'scrapper' ? 'scrap collector' : 'household user'}`
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Full Name
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User style={{ position: 'absolute', left: 14, width: 20, height: 20, color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={roleTab === 'scrapper' ? 'Business or full name' : 'Your full name'}
                    style={{
                      width: '100%', padding: '12px 14px 12px 46px',
                      fontSize: 15, background: '#fff', border: '1px solid #d1d5db',
                      borderRadius: 12, color: '#111827', outline: 'none',
                    }}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail style={{ position: 'absolute', left: 14, width: 20, height: 20, color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%', padding: '12px 14px 12px 46px',
                    fontSize: 15, background: '#fff', border: '1px solid #d1d5db',
                    borderRadius: 12, color: '#111827', outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock style={{ position: 'absolute', left: 14, width: 20, height: 20, color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                  style={{
                    width: '100%', padding: '12px 46px 12px 46px',
                    fontSize: 15, background: '#fff', border: '1px solid #d1d5db',
                    borderRadius: 12, color: '#111827', outline: 'none',
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: 20, height: 20 }} /> : <Eye style={{ width: 20, height: 20 }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '14px 24px', fontSize: 16, fontWeight: 700,
                background: 'linear-gradient(135deg, #22c55e, #15803d)',
                color: '#fff', border: 'none', borderRadius: 12, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(34,197,94,0.3)', marginTop: 8,
              }}
            >
              {isSubmitting ? (
                <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight style={{ width: 20, height: 20 }} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                style={{
                  background: 'none', border: 'none', color: '#16a34a',
                  fontWeight: 700, fontSize: 14, marginLeft: 6, cursor: 'pointer',
                }}
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Scrapper Callout */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              {roleTab === 'user' ? 'Are you a scrap collector?' : 'Not a collector?'}
            </p>
            <button
              type="button"
              onClick={() => setRoleTab(roleTab === 'user' ? 'scrapper' : 'user')}
              style={{
                background: 'none', border: 'none', color: '#16a34a',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {roleTab === 'user' ? <Truck style={{ width: 16, height: 16 }} /> : <Home style={{ width: 16, height: 16 }} />}
              {roleTab === 'user' ? 'Login / Sign up as Scrapper' : 'Continue as Household'}
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
