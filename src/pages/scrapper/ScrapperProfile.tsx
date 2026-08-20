import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { SCRAP_CATEGORIES } from '../../lib/constants'
import type { ScrapCategory } from '../../types/database'
import {
  Recycle, Bell, LogOut, ArrowLeft, Camera, Save, MapPin,
  Phone, User as UserIcon, Loader2, Star, CheckCircle,
  Shield, Briefcase, Ruler
} from 'lucide-react'
import { getInitials } from '../../lib/utils'

export default function ScrapperProfile() {
  const { profile, scrapperProfile, signOut, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    pincode: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const [scrapperForm, setScrapperForm] = useState({
    business_name: '',
    categories_accepted: [] as ScrapCategory[],
    service_radius_km: 5,
    experience_years: null as number | null,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        pincode: profile.pincode || '',
        latitude: profile.latitude,
        longitude: profile.longitude,
      })
    }
    if (scrapperProfile) {
      setScrapperForm({
        business_name: scrapperProfile.business_name || '',
        categories_accepted: scrapperProfile.categories_accepted || [],
        service_radius_km: scrapperProfile.service_radius_km || 5,
        experience_years: scrapperProfile.experience_years,
      })
    }
  }, [profile, scrapperProfile])

  const toggleCategory = (cat: ScrapCategory) => {
    setScrapperForm(f => ({
      ...f,
      categories_accepted: f.categories_accepted.includes(cat)
        ? f.categories_accepted.filter(c => c !== cat)
        : [...f.categories_accepted, cat],
    }))
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          pincode: form.pincode,
          latitude: form.latitude,
          longitude: form.longitude,
        })
        .eq('id', profile.id)

      if (profileError) throw profileError

      if (scrapperProfile) {
        const { error: scrapperError } = await supabase
          .from('scrapper_profiles')
          .update({
            business_name: scrapperForm.business_name,
            categories_accepted: scrapperForm.categories_accepted,
            service_radius_km: scrapperForm.service_radius_km,
            experience_years: scrapperForm.experience_years,
          })
          .eq('id', scrapperProfile.id)

        if (scrapperError) throw scrapperError
      }

      await refreshProfile()
      showToast('success', 'Profile updated successfully')
    } catch {
      showToast('error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      await refreshProfile()
      showToast('success', 'Avatar updated')
    } catch {
      showToast('error', 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
        showToast('success', 'Location detected')
      },
      () => showToast('error', 'Could not detect location')
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/scrapper/dashboard" className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link to="/scrapper/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">ScrapNet</span>
              <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Collector</span>
            </Link>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-8 animate-fade-in">Collector Profile</h1>

        {/* Collector Card Preview */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up">
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-100 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-600">
                    {getInitials(profile.full_name || 'S')}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 gradient-brand rounded-lg flex items-center justify-center cursor-pointer shadow-md hover:opacity-90 transition-opacity">
                {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">
                  {scrapperForm.business_name || profile.full_name || 'Scrapper'}
                </h2>
                {scrapperProfile?.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-amber-600">
                  <Star className="w-3.5 h-3.5" /> {scrapperProfile?.avg_rating || '0.0'}
                </span>
                <span className="text-text-muted">{scrapperProfile?.completed_pickups || 0} pickups</span>
                <span className="text-text-muted">{scrapperForm.service_radius_km} km radius</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-text-muted" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-text-muted" /> Business Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Business Name</label>
              <input
                type="text"
                value={scrapperForm.business_name}
                onChange={e => setScrapperForm(f => ({ ...f, business_name: e.target.value }))}
                placeholder="E.g., Ravi Scrap Services"
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Experience (years)</label>
              <input
                type="number"
                min={0}
                value={scrapperForm.experience_years ?? ''}
                onChange={e => setScrapperForm(f => ({ ...f, experience_years: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Service Area */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Ruler className="w-5 h-5 text-text-muted" /> Service Area
            </h3>
            <button type="button" onClick={detectLocation} className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium cursor-pointer">
              <MapPin className="w-4 h-4" /> Detect Location
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                maxLength={6}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Service Radius (km)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={scrapperForm.service_radius_km}
                onChange={e => setScrapperForm(f => ({ ...f, service_radius_km: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>
          {form.latitude && form.longitude && (
            <div className="mt-4 flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-4 py-2.5 rounded-xl">
              <MapPin className="w-4 h-4" />
              Location: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-text-muted" /> Categories Accepted
          </h3>
          <div className="flex flex-wrap gap-2">
            {SCRAP_CATEGORIES.map(cat => {
              const selected = scrapperForm.categories_accepted.includes(cat.value)
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? 'bg-brand-50 text-brand-700 border-2 border-brand-500 shadow-sm'
                      : 'bg-surface-50 text-text-secondary border-2 border-transparent hover:border-surface-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full gradient-brand text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-500/20 cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </main>
    </div>
  )
}
