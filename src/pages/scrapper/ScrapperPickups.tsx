import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/utils'
import { PICKUP_STATUS_CONFIG } from '../../lib/constants'
import type { Pickup } from '../../types/database'
import {
  Recycle, ArrowLeft, Bell, LogOut, Loader2, Filter,
  Truck, Package
} from 'lucide-react'

export default function ScrapperPickups() {
  const { profile, signOut } = useAuth()
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (profile?.id) fetchPickups()
  }, [profile?.id])

  const fetchPickups = async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('pickups')
      .select('*')
      .eq('scrapper_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setPickups(data as unknown as Pickup[])
    setLoading(false)
  }

  const filtered = filter === 'all' ? pickups : pickups.filter(p => {
    if (filter === 'active') return !['completed', 'cancelled'].includes(p.status)
    return p.status === filter
  })

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/scrapper/dashboard" className="p-2 hover:bg-surface-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center"><Recycle className="w-5 h-5 text-white" /></div>
              <span className="text-lg font-bold text-text-primary">My Pickups</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/scrapper/notifications" className="p-2 text-text-secondary hover:bg-surface-100 rounded-xl transition-colors"><Bell className="w-5 h-5" /></Link>
            <button onClick={signOut} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          {['all', 'active', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${filter === f ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-white text-text-secondary border border-surface-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-600 animate-spin" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
            <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No pickups</h3>
            <p className="text-text-secondary mb-4">Make offers on listings to get pickups scheduled.</p>
            <Link to="/scrapper/discover" className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20">Discover Scrap</Link>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(pickup => {
            const statusConfig = PICKUP_STATUS_CONFIG[pickup.status]
            return (
              <Link key={pickup.id} to={`/scrapper/listings/${pickup.listing_id}`}
                className="block bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-md hover:border-brand-200 transition-all animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-lg">{formatCurrency(pickup.agreed_amount)}</p>
                      <p className="text-xs text-text-muted">{formatDate(pickup.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ color: statusConfig?.color, backgroundColor: statusConfig?.bg }}>
                    {statusConfig?.icon} {statusConfig?.label}
                  </span>
                </div>
                {pickup.pickup_address && pickup.status !== 'cancelled' && (
                  <p className="text-sm text-text-secondary mt-1">📍 {pickup.pickup_address}</p>
                )}
                {pickup.pickup_date && (
                  <p className="text-xs text-text-muted mt-1">🗓️ {new Date(pickup.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                )}
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
