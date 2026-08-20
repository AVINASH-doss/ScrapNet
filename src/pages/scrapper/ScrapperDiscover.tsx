import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { getCategoryInfo, SCRAP_CATEGORIES } from '../../lib/constants'
import { formatDate, formatDistance, haversineDistance, formatTimeWindow } from '../../lib/utils'
import type { ScrapListing } from '../../types/database'
import type { ScrapCategory } from '../../types/database'
import {
  Recycle, Bell, LogOut, MapPin, Clock, Package,
  Loader2, Filter, Search, SortAsc, MessageSquare,
  ArrowLeft, Layers
} from 'lucide-react'

interface ListingWithDistance extends ScrapListing {
  distance: number | null
}

export default function ScrapperDiscover() {
  const { profile, scrapperProfile, signOut } = useAuth()
  const [listings, setListings] = useState<ScrapListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ScrapCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'distance' | 'quantity'>('newest')

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('scrap_listings')
      .select('*')
      .in('status', ['published', 'receiving_offers'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setListings(data as unknown as ScrapListing[])
    }
    setLoading(false)
  }

  // Calculate distances and filter
  const processedListings = useMemo<ListingWithDistance[]>(() => {
    let result = listings.map(l => {
      let distance: number | null = null
      if (profile?.latitude && profile?.longitude && l.pickup_latitude && l.pickup_longitude) {
        distance = haversineDistance(profile.latitude, profile.longitude, l.pickup_latitude, l.pickup_longitude)
      }
      return { ...l, distance }
    })

    // Filter by scrapper's service radius
    if (scrapperProfile?.service_radius_km) {
      result = result.filter(l =>
        l.distance === null || l.distance <= scrapperProfile.service_radius_km
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(l => l.category === categoryFilter)
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.pickup_area?.toLowerCase().includes(q) ||
        l.pickup_city?.toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    } else if (sortBy === 'quantity') {
      result.sort((a, b) => b.estimated_quantity - a.estimated_quantity)
    }
    // newest is default from DB order

    return result
  }, [listings, profile, scrapperProfile, categoryFilter, searchQuery, sortBy])

  // Scrap Pooling: group nearby listings
  const pooledGroups = useMemo(() => {
    if (!profile?.latitude || !profile?.longitude) return []

    const grouped: { center: ListingWithDistance; listings: ListingWithDistance[]; totalQty: number; radius: number }[] = []
    const used = new Set<string>()

    for (const listing of processedListings) {
      if (used.has(listing.id) || !listing.pickup_latitude || !listing.pickup_longitude) continue

      const nearby = processedListings.filter(l => {
        if (l.id === listing.id || used.has(l.id) || !l.pickup_latitude || !l.pickup_longitude) return false
        const dist = haversineDistance(listing.pickup_latitude!, listing.pickup_longitude!, l.pickup_latitude!, l.pickup_longitude!)
        return dist <= 0.7 // within 700m
      })

      if (nearby.length >= 1) {
        const all = [listing, ...nearby]
        all.forEach(l => used.add(l.id))
        const totalQty = all.reduce((sum, l) => sum + l.estimated_quantity, 0)
        const maxDist = all.reduce((max, l) => {
          if (!l.pickup_latitude || !l.pickup_longitude) return max
          const d = haversineDistance(listing.pickup_latitude!, listing.pickup_longitude!, l.pickup_latitude, l.pickup_longitude)
          return Math.max(max, d)
        }, 0)
        grouped.push({ center: listing, listings: all, totalQty, radius: maxDist * 1000 })
      }
    }

    return grouped
  }, [processedListings, profile])

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/scrapper/dashboard" className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">Discover Scrap</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/scrapper/notifications" className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
            </Link>
            <button onClick={signOut} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="mb-6 space-y-4 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search scrap by title, area, city..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted shrink-0" />
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === 'all' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-white text-text-secondary border border-surface-200'
              }`}
            >
              All
            </button>
            {SCRAP_CATEGORIES.slice(0, 7).map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  categoryFilter === cat.value ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-white text-text-secondary border border-surface-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-1">
              <SortAsc className="w-4 h-4 text-text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'newest' | 'distance' | 'quantity')}
                className="text-xs bg-white border border-surface-200 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="distance">Nearest</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrap Pooling Alert */}
        {pooledGroups.length > 0 && (
          <div className="mb-6 space-y-3 animate-slide-up">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" /> Nearby Clusters
            </h3>
            {pooledGroups.map((group, i) => (
              <div key={i} className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-brand-800">
                    {group.totalQty.toFixed(0)}+ kg recyclable material
                  </p>
                  <p className="text-sm text-brand-600">
                    {group.listings.length} nearby households · within {Math.round(group.radius)} m
                  </p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && processedListings.length === 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No scrap nearby</h3>
            <p className="text-text-secondary">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'No listings available in your service area right now. Check back later!'}
            </p>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedListings.map((listing) => {
            const catInfo = getCategoryInfo(listing.category)
            return (
              <Link
                key={listing.id}
                to={`/scrapper/listings/${listing.id}`}
                className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-lg hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200 group animate-slide-up"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-3xl"
                    style={{ backgroundColor: catInfo.color + '15' }}
                  >
                    {catInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate group-hover:text-brand-700 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {listing.estimated_quantity} {listing.quantity_unit} · {catInfo.label}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-text-muted">
                      {listing.distance !== null && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {formatDistance(listing.distance)}
                        </span>
                      )}
                      {listing.pickup_area && (
                        <span className="flex items-center gap-1">
                          📍 {listing.pickup_area}
                        </span>
                      )}
                      {listing.preferred_pickup_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(listing.preferred_pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {listing.preferred_pickup_time_start && `, ${formatTimeWindow(listing.preferred_pickup_time_start, listing.preferred_pickup_time_end)}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {listing.offer_count} offers
                      </span>
                      <span>{formatDate(listing.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
