import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { getCategoryInfo, LISTING_STATUS_CONFIG } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import type { ScrapListing } from '../../types/database'
import {
  Recycle, Bell, LogOut, ArrowLeft, Plus, Package,
  Loader2, Filter, Eye
} from 'lucide-react'

export default function UserListings() {
  const { profile, signOut } = useAuth()
  const [listings, setListings] = useState<ScrapListing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (profile?.id) fetchListings()
  }, [profile?.id])

  const fetchListings = async () => {
    if (!profile) return
    setLoading(true)
    const { data, error } = await supabase
      .from('scrap_listings')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setListings(data as unknown as ScrapListing[])
    }
    setLoading(false)
  }

  const filteredListings = filter === 'all'
    ? listings
    : listings.filter(l => l.status === filter)

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/user/dashboard" className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link to="/user/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">My Listings</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/user/listings/new" className="flex items-center gap-2 px-4 py-2 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20">
              <Plus className="w-4 h-4" /> New
            </Link>
            <Link to="/user/notifications" className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
            </Link>
            <button onClick={signOut} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          {['all', 'published', 'receiving_offers', 'offer_accepted', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                filter === f
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'bg-white text-text-secondary border border-surface-200 hover:border-surface-300'
              }`}
            >
              {f === 'all' ? 'All' : LISTING_STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredListings.length === 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No listings found</h3>
            <p className="text-text-secondary mb-6">
              {filter === 'all' ? 'Create your first scrap listing to get started.' : 'No listings match this filter.'}
            </p>
            <Link
              to="/user/listings/new"
              className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20"
            >
              <Plus className="w-5 h-5" /> Create Listing
            </Link>
          </div>
        )}

        {/* Listings */}
        <div className="space-y-4">
          {filteredListings.map((listing) => {
            const catInfo = getCategoryInfo(listing.category)
            const statusConfig = LISTING_STATUS_CONFIG[listing.status] || LISTING_STATUS_CONFIG.draft
            return (
              <Link
                key={listing.id}
                to={`/user/listings/${listing.id}`}
                className="block bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-md hover:border-brand-200 transition-all group animate-slide-up"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                      style={{ backgroundColor: catInfo.color + '15' }}
                    >
                      {catInfo.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary truncate group-hover:text-brand-700 transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {listing.estimated_quantity} {listing.quantity_unit} · {catInfo.label}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span>{formatDate(listing.created_at)}</span>
                        {listing.offer_count > 0 && (
                          <span className="text-brand-600 font-medium">
                            {listing.offer_count} offer{listing.offer_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{ color: statusConfig.color, backgroundColor: statusConfig.bg }}
                    >
                      {statusConfig.label}
                    </span>
                    <Eye className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
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
