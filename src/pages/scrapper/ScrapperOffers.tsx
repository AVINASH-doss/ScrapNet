import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Offer } from '../../types/database'
import {
  Recycle, ArrowLeft, Bell, LogOut, Loader2, Filter,
  IndianRupee, CheckCircle, XCircle, Clock, TrendingUp
} from 'lucide-react'

interface OfferWithListing extends Offer {
  scrap_listings: { title: string; category: string; estimated_quantity: number; quantity_unit: string }
}

export default function ScrapperOffers() {
  const { profile, signOut } = useAuth()
  const [offers, setOffers] = useState<OfferWithListing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (profile?.id) fetchOffers()
  }, [profile?.id])

  const fetchOffers = async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('offers')
      .select('*, scrap_listings!inner(title, category, estimated_quantity, quantity_unit)')
      .eq('scrapper_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setOffers(data as unknown as OfferWithListing[])
    setLoading(false)
  }

  const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter)

  const statusIcon = (s: string) => {
    if (s === 'accepted') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (s === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-amber-500" />
  }
  const statusColor = (s: string) => {
    if (s === 'accepted') return 'text-green-700 bg-green-50'
    if (s === 'rejected') return 'text-red-700 bg-red-50'
    return 'text-amber-700 bg-amber-50'
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/scrapper/dashboard" className="p-2 hover:bg-surface-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center"><Recycle className="w-5 h-5 text-white" /></div>
              <span className="text-lg font-bold text-text-primary">My Offers</span>
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
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${filter === f ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-white text-text-secondary border border-surface-200'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-600 animate-spin" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
            <TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No offers yet</h3>
            <p className="text-text-secondary mb-4">Browse nearby scrap to make your first offer.</p>
            <Link to="/scrapper/discover" className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20">Find Scrap</Link>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(offer => (
            <Link key={offer.id} to={`/scrapper/listings/${offer.listing_id}`}
              className="block bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-md hover:border-brand-200 transition-all animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{offer.scrap_listings?.title}</h3>
                  <p className="text-sm text-text-muted mt-0.5">
                    {offer.scrap_listings?.estimated_quantity} {offer.scrap_listings?.quantity_unit} · {formatDate(offer.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(offer.offered_amount)}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusColor(offer.status)}`}>
                    {statusIcon(offer.status)} {offer.status}
                  </span>
                </div>
              </div>
              {offer.note && <p className="text-sm text-text-secondary mt-2 italic">"{offer.note}"</p>}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
