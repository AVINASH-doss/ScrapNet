import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../lib/utils'
import { getCategoryInfo } from '../../lib/constants'
import type { ScrapListing, Pickup } from '../../types/database'
import {
  Recycle, MapPin, Package, Clock, CheckCircle, IndianRupee,
  Star, Bell, LogOut, User as UserIcon, ChevronRight, Loader2,
  Search, TrendingUp
} from 'lucide-react'

export default function ScrapperDashboard() {
  const { profile, scrapperProfile, signOut, loading: authLoading } = useAuth()
  useRealtimeNotifications()
  const [stats, setStats] = useState({ nearby: 0, activeOffers: 0, todayPickups: 0, earnings: 0 })
  const [recentPickups, setRecentPickups] = useState<Pickup[]>([])
  const [nearbyListings, setNearbyListings] = useState<ScrapListing[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (profile?.id) {
      fetchDashboard()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [profile?.id, authLoading])

  const fetchDashboard = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      // Nearby listings
      const { data: listings } = await supabase
        .from('scrap_listings')
        .select('*')
        .in('status', ['published', 'receiving_offers'])
        .order('created_at', { ascending: false })
        .limit(5)

      const allListings = (listings || []) as unknown as ScrapListing[]
      setNearbyListings(allListings)

      // Active offers
      let offerCount = 0
      try {
        const { count } = await supabase
          .from('offers')
          .select('*', { count: 'exact', head: true })
          .eq('scrapper_id', profile.id)
          .eq('status', 'pending')
        offerCount = count || 0
      } catch (e) {
        console.warn('Offers fetch notice:', e)
      }

      // Pickups
      let allPickups: Pickup[] = []
      try {
        const { data: pickups } = await supabase
          .from('pickups')
          .select('*')
          .eq('scrapper_id', profile.id)
          .order('created_at', { ascending: false })

        allPickups = (pickups || []) as unknown as Pickup[]
      } catch (e) {
        console.warn('Pickups fetch notice:', e)
      }

      setRecentPickups(allPickups.slice(0, 5))
      const todayPickups = allPickups.filter(p => {
        if (!p.pickup_date) return false
        return new Date(p.pickup_date).toDateString() === new Date().toDateString()
      }).length

      const totalEarnings = allPickups.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.agreed_amount || 0), 0)

      setStats({
        nearby: allListings.length,
        activeOffers: offerCount,
        todayPickups,
        earnings: totalEarnings,
      })

      // Unread notifications
      try {
        const { count: unread } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false)

        setUnreadCount(unread || 0)
      } catch (e) {
        console.warn('Notifications fetch notice:', e)
      }
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Loader2 style={{ width: 32, height: 32, color: '#16a34a' }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Link to="/scrapper/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Recycle style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>ScrapNet</span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#15803d', background: '#f0fdf4',
              padding: '2px 8px', borderRadius: 999, border: '1px solid #bbf7d0',
            }}>Collector</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/scrapper/notifications"
              style={{
                position: 'relative', padding: 8, color: '#4b5563', borderRadius: 10,
                display: 'flex', alignItems: 'center', textDecoration: 'none',
              }}
            >
              <Bell style={{ width: 20, height: 20 }} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 18, height: 18, background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 700, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/scrapper/profile"
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
                borderRadius: 12, textDecoration: 'none', background: '#f3f4f6',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: 'linear-gradient(135deg, #22c55e, #15803d)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                {profile?.full_name || 'Scrapper'}
              </span>
            </Link>
            <button
              onClick={signOut}
              style={{
                padding: 8, background: 'none', border: 'none', color: '#4b5563',
                cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center',
              }}
              title="Sign Out"
            >
              <LogOut style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
            Welcome, {profile?.full_name?.split(' ')[0] || 'Collector'}! 🚚
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>
            {scrapperProfile?.is_verified && (
              <span style={{ color: '#16a34a', fontWeight: 600, marginRight: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle style={{ width: 16, height: 16 }} /> Verified
              </span>
            )}
            Find nearby scrap and grow your business.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20, marginBottom: 36,
        }}>
          {[
            { icon: MapPin, label: 'Nearby Scrap', value: loading ? '...' : String(stats.nearby), color: '#2563eb', bg: '#eff6ff' },
            { icon: TrendingUp, label: 'Active Offers', value: loading ? '...' : String(stats.activeOffers), color: '#9333ea', bg: '#faf5ff' },
            { icon: Clock, label: "Today's Pickups", value: loading ? '...' : String(stats.todayPickups), color: '#d97706', bg: '#fffbeb' },
            { icon: IndianRupee, label: 'Total Earnings', value: loading ? '...' : formatCurrency(stats.earnings), color: '#16a34a', bg: '#f0fdf4' },
            { icon: Star, label: 'Rating', value: String(scrapperProfile?.avg_rating || '4.9'), color: '#ca8a04', bg: '#fefce8' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, padding: 20,
              border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: stat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, color: stat.color,
              }}>
                <stat.icon style={{ width: 20, height: 20 }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main CTA */}
        <Link to="/scrapper/discover" style={{ textDecoration: 'none', display: 'block', marginBottom: 36 }}>
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            borderRadius: 20, padding: '32px 36px', color: '#fff',
            boxShadow: '0 10px 25px rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Discover Nearby Scrap</h2>
              <p style={{ fontSize: 16, color: '#dcfce7', margin: 0 }}>
                Browse available scrap listings in your area and make competitive offers.
              </p>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Search style={{ width: 28, height: 28, color: '#fff' }} />
            </div>
          </div>
        </Link>

        {/* 2-Column Section */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24, marginBottom: 36,
        }}>
          {/* Nearby Scrap */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin style={{ width: 20, height: 20, color: '#2563eb' }} /> Nearby Scrap
              </h3>
              <Link to="/scrapper/discover" style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            {nearbyListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
                <MapPin style={{ width: 32, height: 32, color: '#9ca3af', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, margin: 0 }}>No scrap listings nearby right now</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {nearbyListings.map(listing => {
                  const catInfo = getCategoryInfo(listing.category)
                  return (
                    <Link
                      key={listing.id}
                      to={`/scrapper/listings/${listing.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: 16, background: '#f9fafb', borderRadius: 12,
                        border: '1px solid #e5e7eb', textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{catInfo.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{listing.estimated_quantity} {listing.quantity_unit} · {listing.pickup_area || listing.pickup_city || ''} · {formatDate(listing.created_at)}</p>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', flexShrink: 0 }}>{listing.offer_count} offers</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Pickups */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package style={{ width: 20, height: 20, color: '#d97706' }} /> Recent Pickups
            </h3>
            {recentPickups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
                <Package style={{ width: 32, height: 32, color: '#9ca3af', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, margin: 0 }}>No pickups scheduled yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentPickups.map(pickup => (
                  <Link
                    key={pickup.id}
                    to={`/scrapper/listings/${pickup.listing_id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 16, background: '#f9fafb', borderRadius: 12,
                      border: '1px solid #e5e7eb', textDecoration: 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{formatCurrency(pickup.agreed_amount)}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{formatDate(pickup.created_at)}</p>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
                      color: pickup.status === 'completed' ? '#15803d' : '#d97706',
                      background: pickup.status === 'completed' ? '#f0fdf4' : '#fffbeb',
                    }}>
                      {pickup.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          <Link
            to="/scrapper/discover"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
              textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb',
              }}>
                <Search style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Find Scrap</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Browse nearby listings</p>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: '#9ca3af' }} />
          </Link>

          <Link
            to="/scrapper/profile"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
              textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a',
              }}>
                <UserIcon style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>My Profile</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Update collector profile</p>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: '#9ca3af' }} />
          </Link>

          <Link
            to="/scrapper/notifications"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
              textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#faf5ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea',
              }}>
                <Bell style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Notifications</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>View updates & alerts</p>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: '#9ca3af' }} />
          </Link>
        </div>
      </main>
    </div>
  )
}
