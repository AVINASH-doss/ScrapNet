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
  Star, Eye, TrendingUp, Truck
} from 'lucide-react'

export default function UserDashboard() {
  const { profile, signOut, loading: authLoading } = useAuth()
  useRealtimeNotifications()
  const [stats, setStats] = useState({ active: 0, upcoming: 0, completed: 0, earnings: 0 })
  const [recentListings, setRecentListings] = useState<ScrapListing[]>([])
  const [pendingOffers, setPendingOffers] = useState<(Offer & { listing_title?: string })[]>([])
  const [upcomingPickups, setUpcomingPickups] = useState<Pickup[]>([])
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
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/user/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">ScrapNet</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/user/notifications"
              className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/user/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline font-medium">{profile?.full_name || 'User'}</span>
            </Link>
            <button
              onClick={signOut}
              className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            Welcome, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-text-secondary mt-1">
            Ready to sell some scrap? Post a listing and let collectors come to you.
          </p>
        </div>

        {/* Main CTA */}
        <Link to="/user/listings/new" className="block mb-8 group animate-slide-up">
          <div className="gradient-brand rounded-2xl p-6 lg:p-8 text-white shadow-xl shadow-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2">Sell Your Scrap</h2>
                <p className="text-brand-100 lg:text-lg">Post photos, get offers from nearby collectors, and schedule a pickup.</p>
              </div>
              <div className="hidden sm:flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Link>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {[
            { icon: Package, label: 'Active Listings', value: loading ? '...' : String(stats.active), color: 'text-blue-600 bg-blue-50' },
            { icon: Clock, label: 'Upcoming Pickups', value: loading ? '...' : String(stats.upcoming), color: 'text-amber-600 bg-amber-50' },
            { icon: CheckCircle, label: 'Completed', value: loading ? '...' : String(stats.completed), color: 'text-green-600 bg-green-50' },
            { icon: IndianRupee, label: 'Total Earned', value: loading ? '...' : formatCurrency(stats.earnings), color: 'text-purple-600 bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-surface-200 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Offers */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" /> Incoming Offers
              </h3>
            </div>
            {pendingOffers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 text-center">
                <TrendingUp className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No pending offers</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOffers.map(offer => (
                  <Link
                    key={offer.id}
                    to={`/user/listings/${offer.listing_id}`}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{offer.listing_title}</p>
                      <p className="text-xs text-text-muted">{formatDate(offer.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-700">{formatCurrency(offer.offered_amount)}</p>
                      <p className="text-xs text-amber-600">Pending</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Listings */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" /> Recent Listings
              </h3>
              <Link to="/user/listings" className="text-sm text-brand-600 font-medium hover:text-brand-700">
                View all <ChevronRight className="w-3 h-3 inline" />
              </Link>
            </div>
            {recentListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 text-center">
                <Package className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No listings yet</p>
                <Link to="/user/listings/new" className="text-sm text-brand-600 font-medium mt-2 inline-block">
                  Create one →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentListings.map(listing => {
                  const catInfo = getCategoryInfo(listing.category)
                  const statusConfig = LISTING_STATUS_CONFIG[listing.status]
                  return (
                    <Link
                      key={listing.id}
                      to={`/user/listings/${listing.id}`}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all"
                    >
                      <span className="text-xl">{catInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{listing.title}</p>
                        <p className="text-xs text-text-muted">{listing.estimated_quantity} {listing.quantity_unit} · {formatDate(listing.created_at)}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0" style={{ color: statusConfig?.color, backgroundColor: statusConfig?.bg }}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/user/pickups"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">My Pickups</h3>
                <p className="text-sm text-text-secondary">Track scheduled pickups</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
          <Link
            to="/user/listings"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">My Listings</h3>
                <p className="text-sm text-text-secondary">View and manage your scrap listings</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
          <Link
            to="/user/profile"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">My Profile</h3>
                <p className="text-sm text-text-secondary">Update your details and preferences</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
        </div>
      </main>
    </div>
  )
}
