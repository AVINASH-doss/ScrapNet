import { Link } from 'react-router-dom'
import {
  Recycle, ArrowRight, Shield, MapPin, TrendingUp, Truck,
  Star, Package, Leaf, ChevronRight
} from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Package,
    title: 'Post your scrap',
    desc: 'Take photos, select the category, and add details about your recyclables.',
  },
  {
    step: '02',
    icon: TrendingUp,
    title: 'Get offers',
    desc: 'Nearby verified collectors will send you competitive offers.',
  },
  {
    step: '03',
    icon: Star,
    title: 'Choose collector',
    desc: 'Compare offers, ratings, and distance. Accept the best deal.',
  },
  {
    step: '04',
    icon: Truck,
    title: 'Schedule pickup',
    desc: 'The collector comes to your door. Get paid and rate the experience.',
  },
]

const features = [
  {
    icon: MapPin,
    title: 'Hyperlocal',
    desc: 'Find collectors in your neighborhood. No wasted travel, faster pickups.',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    icon: TrendingUp,
    title: 'Better Prices',
    desc: 'Multiple collectors compete for your scrap. Get the best market price.',
    color: '#22c55e',
    bg: '#f0fdf4',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Your address stays hidden until you accept an offer. Stay in control.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    icon: Star,
    title: 'Trusted Collectors',
    desc: "Verified profiles, ratings, and reviews. Know who you're dealing with.",
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    icon: Truck,
    title: 'Doorstep Pickup',
    desc: 'No need to carry heavy loads. The collector comes to you.',
    color: '#14b8a6',
    bg: '#f0fdfa',
  },
  {
    icon: Leaf,
    title: 'Eco Impact',
    desc: 'Reduce waste, promote recycling, and contribute to a cleaner planet.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
]

const stats = [
  { value: '2,500+', label: 'kg Scrap Collected', emoji: '📦' },
  { value: '850+', label: 'Pickups Completed', emoji: '🚚' },
  { value: '120+', label: 'Active Collectors', emoji: '👷' },
  { value: '1,200+', label: 'Households Connected', emoji: '🏠' },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Recycle style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>ScrapNet</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/auth" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link to="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              background: 'linear-gradient(135deg, #22c55e, #15803d)',
              color: '#fff', borderRadius: 12, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
            }}>
              Get Started <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{
        position: 'relative', paddingTop: 160, paddingBottom: 120,
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #15803d 100%)',
        overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 999,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#bbf7d0', fontSize: 14, fontWeight: 500, marginBottom: 32,
          }}>
            <Leaf style={{ width: 16, height: 16 }} />
            Making recycling accessible for everyone
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 28,
          }}>
            Your scrap has{' '}
            <span style={{ color: '#86efac' }}>value.</span>
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
            color: '#bbf7d0', lineHeight: 1.7, maxWidth: 700, margin: '0 auto 48px',
          }}>
            We bring the right collector to your doorstep. Compare offers,
            schedule pickups, and get the best price for your recyclables.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            <Link to="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 32px', fontSize: 17, fontWeight: 700,
              background: '#fff', color: '#15803d', borderRadius: 16,
              textDecoration: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}>
              <Package style={{ width: 20, height: 20 }} /> Sell Scrap
            </Link>
            <Link to="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 32px', fontSize: 17, fontWeight: 700,
              background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 16,
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
            }}>
              <Truck style={{ width: 20, height: 20 }} /> I'm a Scrapper
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              How it works
            </h2>
            <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 600, margin: '0 auto' }}>
              Selling your scrap has never been easier. Just four simple steps.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24
          }}>
            {steps.map(item => (
              <div key={item.step} style={{
                position: 'relative', background: '#fff', borderRadius: 20,
                padding: 32, border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
                <span style={{
                  position: 'absolute', top: 16, right: 20,
                  fontSize: 48, fontWeight: 800, color: '#f3f4f6',
                  lineHeight: 1, userSelect: 'none',
                }}>
                  {item.step}
                </span>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, #22c55e, #15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, position: 'relative', zIndex: 2,
                }}>
                  <item.icon style={{ width: 22, height: 22, color: '#fff' }} />
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 700, color: '#111827',
                  marginBottom: 8, position: 'relative', zIndex: 2,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: 14, color: '#6b7280', lineHeight: 1.6,
                  position: 'relative', zIndex: 2,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why ScrapNet ─── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              Why{' '}
              <span style={{
                background: 'linear-gradient(135deg, #22c55e, #15803d)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                ScrapNet
              </span>
              ?
            </h2>
            <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 600, margin: '0 auto' }}>
              We make the scrap recycling process convenient, transparent, and trustworthy.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20
          }}>
            {features.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                padding: 24, borderRadius: 16, border: '1px solid #e5e7eb',
                background: '#fff',
              }}>
                <div style={{
                  width: 44, height: 44, minWidth: 44, borderRadius: 12,
                  background: item.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <item.icon style={{ width: 20, height: 20, color: item.color }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Impact Stats ─── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #15803d 100%)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Our Impact
            </h2>
            <p style={{ fontSize: 17, color: '#bbf7d0' }}>
              Together, we're building a cleaner future.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32,
          }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12, lineHeight: 1 }}>{stat.emoji}</div>
                <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 14, color: '#bbf7d0' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '80px 24px', background: '#f9fafb', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            Ready to turn your scrap into value?
          </h2>
          <p style={{ fontSize: 17, color: '#6b7280', marginBottom: 40, lineHeight: 1.6 }}>
            Join thousands of households and collectors already using ScrapNet.
          </p>
          <Link to="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 32px', fontSize: 17, fontWeight: 700,
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            color: '#fff', borderRadius: 16, textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(34,197,94,0.3)',
          }}>
            Get Started Free <ChevronRight style={{ width: 20, height: 20 }} />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ background: '#052e16', padding: '40px 24px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Recycle style={{ width: 18, height: 18, color: '#4ade80' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>ScrapNet</span>
          </div>
          <p style={{ fontSize: 13, color: '#86efac', margin: 0 }}>
            © {new Date().getFullYear()} ScrapNet. Building a cleaner future, one pickup at a time.
          </p>
        </div>
      </footer>
    </div>
  )
}
