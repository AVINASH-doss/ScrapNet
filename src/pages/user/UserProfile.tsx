import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import {
  Recycle, Bell, LogOut, ArrowLeft, Camera, Save, MapPin,
  Phone, Mail, Home, User as UserIcon, Loader2, Star
} from 'lucide-react'
import { getInitials } from '../../lib/utils'

export default function UserProfile() {
  const { profile, signOut, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    apartment_name: '',
    pickup_instructions: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        area: profile.area || '',
        city: profile.city || '',
        pincode: profile.pincode || '',
        apartment_name: profile.apartment_name || '',
        pickup_instructions: profile.pickup_instructions || '',
        latitude: profile.latitude,
        longitude: profile.longitude,
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          area: form.area,
          city: form.city,
          pincode: form.pincode,
          apartment_name: form.apartment_name,
          pickup_instructions: form.pickup_instructions,
          latitude: form.latitude,
          longitude: form.longitude,
        })
        .eq('id', profile.id)

      if (error) throw error
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

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

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
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }))
        showToast('success', 'Location detected')
      },
      () => showToast('error', 'Could not detect location')
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
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
              <span className="text-lg font-bold text-text-primary">ScrapNet</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/user/notifications" className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
            </Link>
            <button onClick={signOut} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-8 animate-fade-in">My Profile</h1>

        {/* Avatar Section */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-100 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-600">
                    {getInitials(profile.full_name || 'U')}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 gradient-brand rounded-lg flex items-center justify-center cursor-pointer shadow-md hover:opacity-90 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{profile.full_name || 'User'}</h2>
              <p className="text-sm text-text-secondary">{profile.email}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  {profile.avg_rating || '0.0'}
                </span>
                <span>{profile.total_transactions} transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-100 border border-surface-200 rounded-xl text-sm text-text-muted cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Address</h3>
            <button
              type="button"
              onClick={detectLocation}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              Detect Location
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Street Address</label>
              <div className="relative">
                <Home className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="House/Flat No., Street, Landmark"
                  rows={2}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Apartment / Community</label>
              <input
                type="text"
                value={form.apartment_name}
                onChange={e => setForm(f => ({ ...f, apartment_name: e.target.value }))}
                placeholder="Optional"
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Area / Locality</label>
              <input
                type="text"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Pickup Instructions</label>
              <textarea
                value={form.pickup_instructions}
                onChange={e => setForm(f => ({ ...f, pickup_instructions: e.target.value }))}
                placeholder="E.g., Ring doorbell twice, gate code 1234..."
                rows={2}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
              />
            </div>
            {form.latitude && form.longitude && (
              <div className="sm:col-span-2 flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-4 py-2.5 rounded-xl">
                <MapPin className="w-4 h-4" />
                Location set: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
              </div>
            )}
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
