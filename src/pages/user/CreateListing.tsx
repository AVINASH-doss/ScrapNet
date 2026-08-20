import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { SCRAP_CATEGORIES, QUANTITY_UNITS } from '../../lib/constants'
import { compressImage } from '../../lib/utils'
import type { ScrapCategory } from '../../types/database'
import {
  Recycle, ArrowLeft, Camera, X, MapPin, Clock, Package,
  FileText, Loader2, ChevronRight, Mic, Upload, Send
} from 'lucide-react'

export default function CreateListing() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const [form, setForm] = useState({
    title: '',
    category: '' as ScrapCategory | '',
    subcategory: '',
    description: '',
    estimated_quantity: '',
    quantity_unit: 'kg',
    condition: '',
    preferred_pickup_date: '',
    preferred_pickup_time_start: '',
    preferred_pickup_time_end: '',
    pickup_address: profile?.address || '',
    pickup_area: profile?.area || '',
    pickup_city: profile?.city || '',
    pickup_pincode: profile?.pincode || '',
    pickup_latitude: profile?.latitude,
    pickup_longitude: profile?.longitude,
    additional_instructions: profile?.pickup_instructions || '',
  })

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newImages: File[] = []
    const newPreviews: string[] = []

    for (const file of Array.from(files)) {
      if (images.length + newImages.length >= 5) break
      try {
        const compressed = await compressImage(file)
        newImages.push(compressed)
        newPreviews.push(URL.createObjectURL(compressed))
      } catch {
        newImages.push(file)
        newPreviews.push(URL.createObjectURL(file))
      }
    }

    setImages(prev => [...prev, ...newImages])
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          pickup_latitude: pos.coords.latitude,
          pickup_longitude: pos.coords.longitude,
        }))
        showToast('success', 'Location detected')
      },
      () => showToast('error', 'Could not detect location')
    )
  }

  const handleSubmit = async (asDraft = false) => {
    if (!profile) return
    if (!form.title || !form.category || !form.estimated_quantity) {
      showToast('error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from('scrap_listings')
        .insert({
          user_id: profile.id,
          title: form.title,
          category: form.category,
          subcategory: form.subcategory || null,
          description: form.description || null,
          estimated_quantity: parseFloat(form.estimated_quantity),
          quantity_unit: form.quantity_unit,
          condition: form.condition || null,
          preferred_pickup_date: form.preferred_pickup_date || null,
          preferred_pickup_time_start: form.preferred_pickup_time_start || null,
          preferred_pickup_time_end: form.preferred_pickup_time_end || null,
          pickup_address: form.pickup_address || null,
          pickup_area: form.pickup_area || null,
          pickup_city: form.pickup_city || null,
          pickup_pincode: form.pickup_pincode || null,
          pickup_latitude: form.pickup_latitude ?? null,
          pickup_longitude: form.pickup_longitude ?? null,
          additional_instructions: form.additional_instructions || null,
          status: asDraft ? 'draft' : 'published',
        })
        .select()
        .single()

      if (listingError) throw listingError

      // Upload images
      const listingData = listing as { id: string }
      if (images.length > 0 && listingData?.id) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const path = `${listingData.id}/${i}_${Date.now()}.jpg`

          const { error: uploadError } = await supabase.storage
            .from('scrap-images')
            .upload(path, file)

          if (uploadError) {
            console.error('Image upload error:', uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('scrap-images')
            .getPublicUrl(path)

          await supabase.from('scrap_images').insert({
            listing_id: listingData.id,
            image_url: publicUrl,
            display_order: i,
          })
        }
      }

      showToast('success', asDraft ? 'Saved as draft' : 'Listing published!', 'Collectors can now see your scrap.')
      navigate('/user/listings')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/user/dashboard" className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">Sell Scrap</span>
            </div>
          </div>
          <div className="text-sm text-text-muted">
            Step {step} of {totalSteps}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'gradient-brand' : 'bg-surface-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text-primary mb-1">What are you selling?</h2>
            <p className="text-text-secondary mb-6">Tell us about your scrap material.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="E.g., Old newspapers and cardboard"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SCRAP_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        form.category === cat.value
                          ? 'bg-brand-50 text-brand-700 border-2 border-brand-500 shadow-sm'
                          : 'bg-white text-text-secondary border-2 border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={form.estimated_quantity}
                      onChange={e => setForm(f => ({ ...f, estimated_quantity: e.target.value }))}
                      placeholder="15"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Unit</label>
                  <select
                    value={form.quantity_unit}
                    onChange={e => setForm(f => ({ ...f, quantity_unit: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
                    {QUANTITY_UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the condition, approximate weight, and any other details..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text-primary mb-1">Add Photos</h2>
            <p className="text-text-secondary mb-6">Photos help collectors make better offers. Add up to 5.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-surface-200 group">
                  <img src={preview} alt={`Scrap ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-surface-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all">
                  <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-text-muted" />
                  </div>
                  <span className="text-xs text-text-muted font-medium">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageAdd}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Voice Note (optional placeholder) */}
            <div className="bg-surface-100 rounded-2xl p-5 border border-surface-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Mic className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Voice Description</p>
                  <p className="text-xs text-text-muted">Optional — record a voice description of your scrap.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pickup Details */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text-primary mb-1">Pickup Details</h2>
            <p className="text-text-secondary mb-6">When and where should the collector come?</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Preferred Date</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="date"
                    value={form.preferred_pickup_date}
                    onChange={e => setForm(f => ({ ...f, preferred_pickup_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">From</label>
                  <input
                    type="time"
                    value={form.preferred_pickup_time_start}
                    onChange={e => setForm(f => ({ ...f, preferred_pickup_time_start: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">To</label>
                  <input
                    type="time"
                    value={form.preferred_pickup_time_end}
                    onChange={e => setForm(f => ({ ...f, preferred_pickup_time_end: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text-primary">Pickup Address</label>
                  <button type="button" onClick={detectLocation} className="flex items-center gap-1 text-xs text-brand-600 font-medium cursor-pointer">
                    <MapPin className="w-3.5 h-3.5" /> Detect Location
                  </button>
                </div>
                <textarea
                  value={form.pickup_address}
                  onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))}
                  placeholder="Full pickup address"
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Area</label>
                  <input
                    type="text"
                    value={form.pickup_area}
                    onChange={e => setForm(f => ({ ...f, pickup_area: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.pickup_city}
                    onChange={e => setForm(f => ({ ...f, pickup_city: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Pincode</label>
                  <input
                    type="text"
                    value={form.pickup_pincode}
                    onChange={e => setForm(f => ({ ...f, pickup_pincode: e.target.value }))}
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Additional Instructions</label>
                <textarea
                  value={form.additional_instructions}
                  onChange={e => setForm(f => ({ ...f, additional_instructions: e.target.value }))}
                  placeholder="E.g., Ring doorbell, gate code 1234..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
              </div>

              {form.pickup_latitude && form.pickup_longitude && (
                <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-4 py-2.5 rounded-xl">
                  <MapPin className="w-4 h-4" />
                  Location set: {form.pickup_latitude.toFixed(4)}, {form.pickup_longitude.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-all cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === totalSteps && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-6 py-3 text-sm font-semibold text-text-secondary border border-surface-200 rounded-xl hover:bg-surface-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 inline mr-1.5" />
                Save Draft
              </button>
            )}
            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!form.title || !form.category || !form.estimated_quantity)) {
                    showToast('error', 'Please fill title, category, and quantity')
                    return
                  }
                  setStep(s => s + 1)
                }}
                className="px-6 py-3 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-md shadow-brand-500/20 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-6 py-3 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
