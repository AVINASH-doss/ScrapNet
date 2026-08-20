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
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/scrapper/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">ScrapNet</span>
            <span className="hidden sm:inline text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Collector</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/scrapper/notifications" className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/scrapper/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors">
              <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <span className="hidden sm:inline font-medium">{profile?.full_name || 'Scrapper'}</span>
            </Link>
            <button onClick={signOut} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Collector'}! 🚚
          </h1>
          <p className="text-text-secondary mt-1">
            {scrapperProfile?.is_verified && (
              <span className="inline-flex items-center gap-1 text-brand-600 mr-2">
                <CheckCircle className="w-4 h-4" /> Verified
              </span>
            )}
            Find nearby scrap and grow your business.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 animate-slide-up">
          {[
            { icon: MapPin, label: 'Nearby Scrap', value: loading ? '...' : String(stats.nearby), color: 'text-blue-600 bg-blue-50' },
            { icon: TrendingUp, label: 'Active Offers', value: loading ? '...' : String(stats.activeOffers), color: 'text-purple-600 bg-purple-50' },
            { icon: Clock, label: "Today's Pickups", value: loading ? '...' : String(stats.todayPickups), color: 'text-amber-600 bg-amber-50' },
            { icon: IndianRupee, label: 'Total Earnings', value: loading ? '...' : formatCurrency(stats.earnings), color: 'text-green-600 bg-green-50' },
            { icon: Star, label: 'Rating', value: String(scrapperProfile?.avg_rating || '0.0'), color: 'text-yellow-600 bg-yellow-50' },
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

        {/* Main CTA */}
        <Link to="/scrapper/discover" className="block mb-8 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="gradient-brand rounded-2xl p-6 lg:p-8 text-white shadow-xl shadow-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2">Discover Nearby Scrap</h2>
                <p className="text-brand-100 lg:text-lg">Browse available scrap listings in your area and make offers.</p>
              </div>
              <div className="hidden sm:flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center group-hover:bg-white/30 transition-colors">
                <Search className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nearby Listings Preview */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" /> Nearby Scrap
              </h3>
              <Link to="/scrapper/discover" className="text-sm text-brand-600 font-medium hover:text-brand-700">
                View all <ChevronRight className="w-3 h-3 inline" />
              </Link>
            </div>
            {nearbyListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 text-center">
                <MapPin className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No scrap nearby right now</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nearbyListings.map(listing => {
                  const catInfo = getCategoryInfo(listing.category)
                  return (
                    <Link key={listing.id} to={`/scrapper/listings/${listing.id}`}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all">
                      <span className="text-xl">{catInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{listing.title}</p>
                        <p className="text-xs text-text-muted">{listing.estimated_quantity} {listing.quantity_unit} · {listing.pickup_area || listing.pickup_city || ''} · {formatDate(listing.created_at)}</p>
                      </div>
                      <span className="text-xs text-brand-600 font-medium">{listing.offer_count} offers</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Pickups */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" /> Recent Pickups
            </h3>
            {recentPickups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 text-center">
                <Package className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No pickups yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPickups.map(pickup => (
                  <Link key={pickup.id} to={`/scrapper/listings/${pickup.listing_id}`}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-surface-200 hover:shadow-md transition-all">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{formatCurrency(pickup.agreed_amount)}</p>
                      <p className="text-xs text-text-muted">{formatDate(pickup.created_at)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      pickup.status === 'completed' ? 'text-green-700 bg-green-50' :
                      pickup.status === 'cancelled' ? 'text-red-700 bg-red-50' :
                      'text-amber-700 bg-amber-50'
                    }`}>
                      {pickup.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link to="/scrapper/discover" className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Search className="w-5 h-5" /></div>
              <div><h3 className="font-semibold text-text-primary">Find Scrap</h3><p className="text-sm text-text-secondary">Browse nearby listings</p></div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
          <Link to="/scrapper/profile" className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>
              <div><h3 className="font-semibold text-text-primary">My Profile</h3><p className="text-sm text-text-secondary">Update collector profile</p></div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
          <Link to="/scrapper/notifications" className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5" /></div>
              <div><h3 className="font-semibold text-text-primary">Notifications</h3><p className="text-sm text-text-secondary">View updates & alerts</p></div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
        </div>
      </main>
    </div>
  )
}
