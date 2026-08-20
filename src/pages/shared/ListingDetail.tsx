import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { getCategoryInfo, LISTING_STATUS_CONFIG, PICKUP_STATUS_CONFIG } from '../../lib/constants'
import { formatDate, formatCurrency, formatTimeWindow, formatDistance, haversineDistance, getInitials } from '../../lib/utils'
import type { ScrapListing, ScrapImage, Offer, Profile, ScrapperProfile, Pickup } from '../../types/database'
import {
  Recycle, ArrowLeft, MapPin, Clock, Package, Star,
  Loader2, IndianRupee, CheckCircle, XCircle, Lock,
  MessageSquare, Truck, Send, User as UserIcon
} from 'lucide-react'

interface OfferWithProfile extends Offer {
  profiles: Pick<Profile, 'full_name' | 'avatar_url' | 'latitude' | 'longitude'>
  scrapper_profiles: Pick<ScrapperProfile, 'business_name' | 'avg_rating' | 'completed_pickups' | 'is_verified'>[]
}

export default function ListingDetail() {
  const { id } = useParams()
  const { profile, scrapperProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [listing, setListing] = useState<ScrapListing | null>(null)
  const [images, setImages] = useState<ScrapImage[]>([])
  const [offers, setOffers] = useState<OfferWithProfile[]>([])
  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Offer form (for scrapper)
  const [offerForm, setOfferForm] = useState({
    amount: '',
    pickup_time: '',
    note: '',
  })
  const [showOfferForm, setShowOfferForm] = useState(false)

  const isOwner = profile?.id === listing?.user_id
  const isScrapper = profile?.role === 'scrapper'

  useEffect(() => {
    if (id) fetchListing()
  }, [id])

  const fetchListing = async () => {
    setLoading(true)
    try {
      // Fetch listing
      const { data: listingData } = await supabase
        .from('scrap_listings')
        .select('*')
        .eq('id', id)
        .single()

      if (listingData) {
        setListing(listingData as unknown as ScrapListing)
      }

      // Fetch images
      const { data: imageData } = await supabase
        .from('scrap_images')
        .select('*')
        .eq('listing_id', id!)
        .order('display_order')

      if (imageData) setImages(imageData as unknown as ScrapImage[])

      // Fetch offers
      const { data: offerData } = await supabase
        .from('offers')
        .select('*, profiles!offers_scrapper_id_fkey(full_name, avatar_url, latitude, longitude), scrapper_profiles!inner(business_name, avg_rating, completed_pickups, is_verified)')
        .eq('listing_id', id!)
        .order('created_at', { ascending: false })

      if (offerData) setOffers(offerData as unknown as OfferWithProfile[])

      // Fetch pickup if exists
      const { data: pickupData } = await supabase
        .from('pickups')
        .select('*')
        .eq('listing_id', id!)
        .limit(1)
        .single()

      if (pickupData) setPickup(pickupData as unknown as Pickup)
    } catch {
      // Pickup may not exist, that's fine
    }
    setLoading(false)
  }

  const handleSubmitOffer = async () => {
    if (!profile || !id || !offerForm.amount) return
    setSubmittingOffer(true)
    try {
      const { error } = await supabase.from('offers').insert({
        listing_id: id,
        scrapper_id: profile.id,
        offered_amount: parseFloat(offerForm.amount),
        proposed_pickup_time: offerForm.pickup_time ? new Date(offerForm.pickup_time).toISOString() : null,
        note: offerForm.note || null,
      })
      if (error) throw error

      // Update listing offer count and status
      await supabase
        .from('scrap_listings')
        .update({
          offer_count: (listing?.offer_count ?? 0) + 1,
          status: 'receiving_offers',
        })
        .eq('id', id)

      // Create notification for listing owner
      if (listing) {
        await supabase.from('notifications').insert({
          user_id: listing.user_id,
          type: 'offer_received',
          title: 'New offer received',
          message: `${profile.full_name} offered ${formatCurrency(parseFloat(offerForm.amount))} for "${listing.title}"`,
          data: { listing_id: id, offer_amount: parseFloat(offerForm.amount) },
        })
      }

      showToast('success', 'Offer submitted!', 'The household will review your offer.')
      setShowOfferForm(false)
      setOfferForm({ amount: '', pickup_time: '', note: '' })
      fetchListing()
    } catch {
      showToast('error', 'Failed to submit offer')
    } finally {
      setSubmittingOffer(false)
    }
  }

  const handleAcceptOffer = async (offer: OfferWithProfile) => {
    if (!listing || !profile) return
    setAcceptingOffer(offer.id)
    try {
      // Update offer status
      await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)

      // Reject other pending offers
      await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('listing_id', listing.id)
        .neq('id', offer.id)
        .eq('status', 'pending')

      // Update listing status
      await supabase.from('scrap_listings').update({ status: 'offer_accepted' }).eq('id', listing.id)

      // Create pickup record — reveal private address
      await supabase.from('pickups').insert({
        listing_id: listing.id,
        offer_id: offer.id,
        user_id: profile.id,
        scrapper_id: offer.scrapper_id,
        agreed_amount: offer.offered_amount,
        pickup_date: listing.preferred_pickup_date,
        pickup_time: listing.preferred_pickup_time_start,
        pickup_address: listing.pickup_address || profile.address || '',
        pickup_latitude: listing.pickup_latitude,
        pickup_longitude: listing.pickup_longitude,
        contact_phone: profile.phone,
        pickup_instructions: listing.additional_instructions,
        status: 'accepted',
      })

      // Notify scrapper
      await supabase.from('notifications').insert({
        user_id: offer.scrapper_id,
        type: 'offer_accepted',
        title: 'Offer accepted! 🎉',
        message: `Your offer of ${formatCurrency(offer.offered_amount)} for "${listing.title}" has been accepted. View pickup details.`,
        data: { listing_id: listing.id, offer_id: offer.id },
      })

      showToast('success', 'Offer accepted!', 'Pickup details have been shared with the collector.')
      fetchListing()
    } catch {
      showToast('error', 'Failed to accept offer')
    } finally {
      setAcceptingOffer(null)
    }
  }

  const handleRejectOffer = async (offerId: string) => {
    try {
      await supabase.from('offers').update({ status: 'rejected' }).eq('id', offerId)
      showToast('info', 'Offer rejected')
      fetchListing()
    } catch {
      showToast('error', 'Failed to reject offer')
    }
  }

  const handleUpdatePickupStatus = async (newStatus: string) => {
    if (!pickup) return
    setUpdatingStatus(true)
    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
      await supabase.from('pickups').update(updateData).eq('id', pickup.id)

      // Update listing status
      if (newStatus === 'completed' && listing) {
        await supabase.from('scrap_listings').update({ status: 'completed' }).eq('id', listing.id)

        // Update scrapper stats
        if (scrapperProfile) {
          await supabase.from('scrapper_profiles').update({
            completed_pickups: scrapperProfile.completed_pickups + 1,
            total_earnings: scrapperProfile.total_earnings + pickup.agreed_amount,
          }).eq('id', scrapperProfile.id)
        }

        // Notify both parties for rating
        await supabase.from('notifications').insert([
          {
            user_id: pickup.user_id,
            type: 'rating_request' as const,
            title: 'Rate your experience',
            message: 'Your scrap pickup is complete! Please rate the collector.',
            data: { pickup_id: pickup.id },
          },
          {
            user_id: pickup.scrapper_id,
            type: 'pickup_completed' as const,
            title: 'Pickup completed! 🎉',
            message: `Pickup for "${listing.title}" is complete.`,
            data: { pickup_id: pickup.id },
          },
        ])
      }

      // Status update notification
      const statusLabel = PICKUP_STATUS_CONFIG[newStatus]?.label || newStatus
      if (listing && newStatus !== 'completed') {
        await supabase.from('notifications').insert({
          user_id: pickup.user_id,
          type: newStatus === 'on_the_way' ? 'pickup_on_the_way' as const : 'pickup_scheduled' as const,
          title: `Pickup: ${statusLabel}`,
          message: `Collector status updated to "${statusLabel}" for "${listing.title}"`,
          data: { pickup_id: pickup.id },
        })
      }

      showToast('success', `Status updated to ${statusLabel}`)
      fetchListing()
    } catch {
      showToast('error', 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary">Listing not found</h2>
          <Link to={isScrapper ? '/scrapper/discover' : '/user/listings'} className="text-brand-600 mt-2 inline-block">
            Go back
          </Link>
        </div>
      </div>
    )
  }

  const catInfo = getCategoryInfo(listing.category)
  const statusConfig = LISTING_STATUS_CONFIG[listing.status]
  const hasAcceptedOffer = offers.some(o => o.status === 'accepted')
  const myOffer = isScrapper ? offers.find(o => o.scrapper_id === profile?.id) : null
  const isPickupParticipant = pickup && (pickup.user_id === profile?.id || pickup.scrapper_id === profile?.id)

  // Distance calculation for scrapper
  let distance: number | null = null
  if (isScrapper && profile?.latitude && profile?.longitude && listing.pickup_latitude && listing.pickup_longitude) {
    distance = haversineDistance(profile.latitude, profile.longitude, listing.pickup_latitude, listing.pickup_longitude)
  }

  // Next pickup status options
  const pickupStatusFlow: Record<string, string> = {
    accepted: 'on_the_way',
    on_the_way: 'arrived',
    arrived: 'collected',
    collected: 'completed',
  }
  const nextStatus = pickup ? pickupStatusFlow[pickup.status] : null

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-xl transition-colors mr-3 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary truncate">{listing.title}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Listing Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {images.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden animate-fade-in">
                <div className="grid grid-cols-2 gap-1">
                  {images.map((img, i) => (
                    <div key={img.id} className={`${i === 0 ? 'col-span-2' : ''} aspect-video overflow-hidden`}>
                      <img src={img.image_url} alt={`Scrap ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{catInfo.icon}</span>
                    <span className="text-sm font-medium px-3 py-1 rounded-lg" style={{ color: catInfo.color, backgroundColor: catInfo.color + '15' }}>
                      {catInfo.label}
                    </span>
                    <span className="text-sm font-semibold px-3 py-1 rounded-lg" style={{ color: statusConfig?.color, backgroundColor: statusConfig?.bg }}>
                      {statusConfig?.label}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-text-primary">{listing.title}</h1>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-surface-50 rounded-xl p-3">
                  <p className="text-xs text-text-muted mb-1">Quantity</p>
                  <p className="font-bold text-text-primary">{listing.estimated_quantity} {listing.quantity_unit}</p>
                </div>
                {distance !== null && (
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">Distance</p>
                    <p className="font-bold text-text-primary">{formatDistance(distance)}</p>
                  </div>
                )}
                <div className="bg-surface-50 rounded-xl p-3">
                  <p className="text-xs text-text-muted mb-1">Posted</p>
                  <p className="font-bold text-text-primary">{formatDate(listing.created_at)}</p>
                </div>
              </div>

              {listing.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">Description</h3>
                  <p className="text-sm text-text-secondary">{listing.description}</p>
                </div>
              )}

              {/* Pickup preferences */}
              <div className="flex flex-wrap gap-3 text-sm">
                {listing.preferred_pickup_date && (
                  <div className="flex items-center gap-1.5 text-text-secondary bg-surface-50 px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(listing.preferred_pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {listing.preferred_pickup_time_start && ` · ${formatTimeWindow(listing.preferred_pickup_time_start, listing.preferred_pickup_time_end)}`}
                  </div>
                )}
                {listing.pickup_area && (
                  <div className="flex items-center gap-1.5 text-text-secondary bg-surface-50 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.pickup_area}{listing.pickup_city ? `, ${listing.pickup_city}` : ''}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-text-secondary bg-surface-50 px-3 py-1.5 rounded-lg">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {listing.offer_count} offer{listing.offer_count !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Privacy notice (for scrapper) */}
              {isScrapper && !hasAcceptedOffer && (
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
                  <Lock className="w-4 h-4 shrink-0" />
                  Contact details and exact address are protected until pickup is confirmed.
                </div>
              )}

              {/* Revealed details (after acceptance) */}
              {isPickupParticipant && pickup && (
                <div className="mt-4 bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-brand-800 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Pickup Details (Revealed)
                  </h3>
                  <div className="space-y-1 text-sm text-brand-700">
                    {pickup.pickup_address && <p>📍 {pickup.pickup_address}</p>}
                    {pickup.contact_phone && <p>📞 {pickup.contact_phone}</p>}
                    {pickup.pickup_instructions && <p>📝 {pickup.pickup_instructions}</p>}
                    <p>💰 Agreed: {formatCurrency(pickup.agreed_amount)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pickup Status */}
            {pickup && isPickupParticipant && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Pickup Status
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  {Object.entries(PICKUP_STATUS_CONFIG).map(([key, config], i) => {
                    const statusOrder = ['accepted', 'on_the_way', 'arrived', 'collected', 'completed']
                    const currentIndex = statusOrder.indexOf(pickup.status)
                    const thisIndex = statusOrder.indexOf(key)
                    const isActive = thisIndex <= currentIndex
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          isActive ? 'gradient-brand text-white' : 'bg-surface-100 text-text-muted'
                        }`}>
                          {config.icon}
                        </div>
                        {i < Object.keys(PICKUP_STATUS_CONFIG).length - 1 && (
                          <div className={`w-6 h-0.5 ${isActive ? 'bg-brand-500' : 'bg-surface-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Current: <span className="font-semibold" style={{ color: PICKUP_STATUS_CONFIG[pickup.status]?.color }}>
                    {PICKUP_STATUS_CONFIG[pickup.status]?.icon} {PICKUP_STATUS_CONFIG[pickup.status]?.label}
                  </span>
                </p>

                {/* Scrapper can update status */}
                {isScrapper && pickup.scrapper_id === profile?.id && nextStatus && (
                  <button
                    onClick={() => handleUpdatePickupStatus(nextStatus)}
                    disabled={updatingStatus}
                    className="w-full gradient-brand text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Update to: {PICKUP_STATUS_CONFIG[nextStatus]?.icon} {PICKUP_STATUS_CONFIG[nextStatus]?.label}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Offers / Actions */}
          <div className="space-y-6">
            {/* Scrapper: Make Offer */}
            {isScrapper && !hasAcceptedOffer && !myOffer && listing.status !== 'completed' && listing.status !== 'cancelled' && (
              <div className="bg-white rounded-2xl border border-surface-200 p-5 animate-slide-up">
                {!showOfferForm ? (
                  <button
                    onClick={() => setShowOfferForm(true)}
                    className="w-full gradient-brand text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer"
                  >
                    <IndianRupee className="w-5 h-5" />
                    Make Offer
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-text-primary">Your Offer</h3>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Amount (₹)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="number"
                          min={0}
                          value={offerForm.amount}
                          onChange={e => setOfferForm(f => ({ ...f, amount: e.target.value }))}
                          placeholder="250"
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Pickup Time</label>
                      <input
                        type="datetime-local"
                        value={offerForm.pickup_time}
                        onChange={e => setOfferForm(f => ({ ...f, pickup_time: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Note (optional)</label>
                      <textarea
                        value={offerForm.note}
                        onChange={e => setOfferForm(f => ({ ...f, note: e.target.value }))}
                        placeholder="I can collect all items..."
                        rows={2}
                        className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowOfferForm(false)}
                        className="flex-1 py-2.5 text-sm font-medium text-text-secondary border border-surface-200 rounded-xl hover:bg-surface-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitOffer}
                        disabled={submittingOffer || !offerForm.amount}
                        className="flex-1 gradient-brand text-white font-semibold py-2.5 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {submittingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My offer status (scrapper) */}
            {myOffer && (
              <div className="bg-white rounded-2xl border border-surface-200 p-5 animate-slide-up">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Your Offer</h3>
                <div className="text-2xl font-bold text-text-primary mb-1">{formatCurrency(myOffer.offered_amount)}</div>
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${
                  myOffer.status === 'accepted' ? 'text-green-700 bg-green-50' :
                  myOffer.status === 'rejected' ? 'text-red-700 bg-red-50' :
                  'text-amber-700 bg-amber-50'
                }`}>
                  {myOffer.status === 'accepted' ? '✅ Accepted' :
                   myOffer.status === 'rejected' ? '❌ Rejected' :
                   '⏳ Pending'}
                </span>
              </div>
            )}

            {/* Offers list (for listing owner) */}
            {isOwner && offers.length > 0 && (
              <div className="space-y-3 animate-slide-up">
                <h3 className="text-lg font-semibold text-text-primary">
                  Offers ({offers.length})
                </h3>
                {offers.map(offer => {
                  const sp = offer.scrapper_profiles?.[0]
                  const op = offer.profiles
                  let offerDistance: number | null = null
                  if (listing.pickup_latitude && listing.pickup_longitude && op?.latitude && op?.longitude) {
                    offerDistance = haversineDistance(listing.pickup_latitude, listing.pickup_longitude, op.latitude, op.longitude)
                  }

                  return (
                    <div key={offer.id} className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                          {op?.avatar_url ? (
                            <img src={op.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-brand-600">
                              {getInitials(sp?.business_name || op?.full_name || 'S')}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-text-primary text-sm truncate">
                              {sp?.business_name || op?.full_name || 'Collector'}
                            </h4>
                            {sp?.is_verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" /> {sp?.avg_rating || '0.0'}
                            </span>
                            <span>{sp?.completed_pickups || 0} pickups</span>
                            {offerDistance && <span>{formatDistance(offerDistance)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-2xl font-bold text-text-primary mb-1">
                        {formatCurrency(offer.offered_amount)}
                      </div>
                      {offer.note && (
                        <p className="text-sm text-text-secondary mb-3">"{offer.note}"</p>
                      )}

                      {offer.status === 'pending' && !hasAcceptedOffer && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptOffer(offer)}
                            disabled={!!acceptingOffer}
                            className="flex-1 gradient-brand text-white font-semibold py-2.5 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
                          >
                            {acceptingOffer === offer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectOffer(offer.id)}
                            className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {offer.status === 'accepted' && (
                        <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Accepted
                        </span>
                      )}
                      {offer.status === 'rejected' && (
                        <span className="text-sm text-text-muted">Rejected</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rating (after completion) */}
            {pickup?.status === 'completed' && isPickupParticipant && (
              <RatingForm pickupId={pickup.id} raterId={profile!.id} ratedId={isOwner ? pickup.scrapper_id : pickup.user_id} onDone={fetchListing} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Rating sub-component
function RatingForm({ pickupId, raterId, ratedId, onDone }: {
  pickupId: string; raterId: string; ratedId: string; onDone: () => void
}) {
  const { showToast } = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Check if already rated
    supabase
      .from('ratings')
      .select('id')
      .eq('pickup_id', pickupId)
      .eq('rater_id', raterId)
      .single()
      .then(({ data }) => {
        if (data) setSubmitted(true)
      })
  }, [pickupId, raterId])

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('error', 'Please select a rating')
      return
    }
    setSubmitting(true)
    try {
      await supabase.from('ratings').insert({
        pickup_id: pickupId,
        rater_id: raterId,
        rated_id: ratedId,
        rating,
        comment: comment || null,
      })

      // Update rated user's average rating
      const { data: allRatings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_id', ratedId)

      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allRatings.length
        await supabase.from('profiles').update({ avg_rating: Math.round(avg * 100) / 100 }).eq('id', ratedId)
      }

      showToast('success', 'Rating submitted! ⭐')
      setSubmitted(true)
      onDone()
    } catch {
      showToast('error', 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-green-700">Rating submitted</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 animate-slide-up">
      <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-500" /> Rate this experience
      </h3>
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            onClick={() => setRating(s)}
            className="cursor-pointer transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-surface-300'}`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Optional comment..."
        rows={2}
        className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none mb-3"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full gradient-brand text-white font-semibold py-2.5 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Submit Rating
      </button>
    </div>
  )
}
