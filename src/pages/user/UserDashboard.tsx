import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'
import { Link } from 'react-router-dom'
import { getCategoryInfo, LISTING_STATUS_CONFIG } from '../../lib/constants'
import { formatDate, formatCurrency } from '../../lib/utils'
import type { ScrapListing, Offer, Pickup } from '../../types/database'
import {
  Recycle, Plus, Package, Clock, CheckCircle, IndianRupee,
  Bell, LogOut, User as UserIcon, ChevronRight, Loader2,
  TrendingUp, Truck
} from 'lucide-react'

export default function UserDashboard() {
  const { profile, signOut, loading: authLoading } = useAuth()
  useRealtimeNotifications()
  const [stats, setStats] = useState({ active: 0, upcoming: 0, completed: 0, earnings: 0 })
  const [recentListings, setRecentListings] = useState<ScrapListing[]>([])
  const [pendingOffers, setPendingOffers] = useState<(Offer & { listing_title?: string })[]>([])
  const [, setUpcomingPickups] = useState<Pickup[]>([])
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
      // Fetch listings
      const { data: listings } = await supabase
        .from('scrap_listings')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const allListings = (listings || []) as unknown as ScrapListing[]
      setRecentListings(allListings)

      // Stats
      const active = allListings.filter(l => ['published', 'receiving_offers', 'offer_accepted', 'pickup_scheduled'].includes(l.status)).length
      const completed = allListings.filter(l => l.status === 'completed').length

      // Fetch pickups
      const { data: pickups } = await supabase
        .from('pickups')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      const allPickups = (pickups || []) as unknown as Pickup[]
      const upcoming = allPickups.filter(p => !['completed', 'cancelled'].includes(p.status))
      setUpcomingPickups(upcoming)
      const totalEarnings = allPickups.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.agreed_amount || 0), 0)

      setStats({ active, upcoming: upcoming.length, completed, earnings: totalEarnings })

      // Fetch pending offers on user's listings
      try {
        const { data: offers } = await supabase
          .from('offers')
          .select('*, scrap_listings!inner(title, user_id)')
          .eq('status', 'pending')
          .eq('scrap_listings.user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (offers) {
          setPendingOffers(offers.map((o: Record<string, unknown>) => ({
            ...(o as unknown as Offer),
            listing_title: (o.scrap_listings as { title: string })?.title,
          })))
        }
      } catch (e) {
        console.warn('Offers query notice:', e)
      }

      // Unread notifications
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false)

        setUnreadCount(count || 0)
      } catch (e) {
        console.warn('Notifications query notice:', e)
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
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
          <Link to="/user/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Recycle style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>ScrapNet</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/user/notifications"
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
              to="/user/profile"
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
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                {profile?.full_name || 'Household User'}
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
            Welcome, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>
            Ready to sell some scrap? Post a listing and let collectors come to you.
          </p>
        </div>

        {/* Main CTA Banner */}
        <Link to="/user/listings/new" style={{ textDecoration: 'none', display: 'block', marginBottom: 36 }}>
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            borderRadius: 20, padding: '32px 36px', color: '#fff',
            boxShadow: '0 10px 25px rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Sell Your Scrap</h2>
              <p style={{ fontSize: 16, color: '#dcfce7', margin: 0 }}>
                Post photos, get offers from nearby collectors, and schedule a pickup.
              </p>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Plus style={{ width: 28, height: 28, color: '#fff' }} />
            </div>
          </div>
        </Link>

        {/* Stats Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20, marginBottom: 36,
        }}>
          {[
            { icon: Package, label: 'Active Listings', value: loading ? '...' : String(stats.active), color: '#2563eb', bg: '#eff6ff' },
            { icon: Clock, label: 'Upcoming Pickups', value: loading ? '...' : String(stats.upcoming), color: '#d97706', bg: '#fffbeb' },
            { icon: CheckCircle, label: 'Completed', value: loading ? '...' : String(stats.completed), color: '#16a34a', bg: '#f0fdf4' },
            { icon: IndianRupee, label: 'Total Earned', value: loading ? '...' : formatCurrency(stats.earnings), color: '#9333ea', bg: '#faf5ff' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, padding: 24,
              border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: stat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14, color: stat.color,
              }}>
                <stat.icon style={{ width: 22, height: 22 }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Lists Section */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24, marginBottom: 36,
        }}>
          {/* Pending Offers */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp style={{ width: 20, height: 20, color: '#9333ea' }} /> Incoming Offers
            </h3>
            {pendingOffers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
                <TrendingUp style={{ width: 32, height: 32, color: '#9ca3af', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, margin: 0 }}>No pending offers right now</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingOffers.map(offer => (
                  <Link
                    key={offer.id}
                    to={`/user/listings/${offer.listing_id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 16, background: '#f9fafb', borderRadius: 12,
                      border: '1px solid #e5e7eb', textDecoration: 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>{offer.listing_title}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{formatDate(offer.created_at)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#15803d', margin: '0 0 2px' }}>{formatCurrency(offer.offered_amount)}</p>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>Pending</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Listings */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package style={{ width: 20, height: 20, color: '#2563eb' }} /> Recent Listings
              </h3>
              <Link to="/user/listings" style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            {recentListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
                <Package style={{ width: 32, height: 32, color: '#9ca3af', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, margin: '0 0 8px' }}>No listings created yet</p>
                <Link to="/user/listings/new" style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                  Create one now →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentListings.map(listing => {
                  const catInfo = getCategoryInfo(listing.category)
                  const statusConfig = LISTING_STATUS_CONFIG[listing.status]
                  return (
                    <Link
                      key={listing.id}
                      to={`/user/listings/${listing.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: 16, background: '#f9fafb', borderRadius: 12,
                        border: '1px solid #e5e7eb', textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{catInfo.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{listing.estimated_quantity} {listing.quantity_unit} · {formatDate(listing.created_at)}</p>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                        color: statusConfig?.color, backgroundColor: statusConfig?.bg,
                      }}>
                        {statusConfig?.label}
                      </span>
                    </Link>
                  )
                })}
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
            to="/user/pickups"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
              textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#fffbeb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706',
              }}>
                <Truck style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>My Pickups</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Track scheduled pickups</p>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: '#9ca3af' }} />
          </Link>

          <Link
            to="/user/listings"
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
                <Package style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>My Listings</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>View and manage your scrap listings</p>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: '#9ca3af' }} />
          </Link>

          <Link
            to="/user/profile"
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
                <UserIcon style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>My Profile</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Update details and address</p>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: '#9ca3af' }} />
          </Link>
        </div>
      </main>
    </div>
  )
}
