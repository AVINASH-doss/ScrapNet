import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import {
  Recycle, MapPin, Package, Clock, CheckCircle, IndianRupee,
  Star, Bell, LogOut, User as UserIcon, ChevronRight, Loader2,
  Search, TrendingUp
} from 'lucide-react'

export default function ScrapperDashboard() {
  const { profile, scrapperProfile, signOut, loading } = useAuth()

  if (loading) {
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
          <Link to="/scrapper/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">ScrapNet</span>
            <span className="hidden sm:inline text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
              Collector
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/scrapper/notifications"
              className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              to="/scrapper/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <span className="hidden sm:inline font-medium">{profile?.full_name || 'Scrapper'}</span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 animate-slide-up">
          {[
            { icon: MapPin, label: 'Nearby Scrap', value: '0', color: 'text-blue-600 bg-blue-50' },
            { icon: TrendingUp, label: 'Active Offers', value: String(scrapperProfile?.total_offers ?? 0), color: 'text-purple-600 bg-purple-50' },
            { icon: Clock, label: "Today's Pickups", value: '0', color: 'text-amber-600 bg-amber-50' },
            { icon: IndianRupee, label: 'Total Earnings', value: `₹${scrapperProfile?.total_earnings ?? 0}`, color: 'text-green-600 bg-green-50' },
            { icon: Star, label: 'Rating', value: String(scrapperProfile?.avg_rating ?? '0.0'), color: 'text-yellow-600 bg-yellow-50' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-surface-200 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main CTA */}
        <Link
          to="/scrapper/discover"
          className="block mb-8 group animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="gradient-brand rounded-2xl p-6 lg:p-8 text-white shadow-xl shadow-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2">Discover Nearby Scrap</h2>
                <p className="text-brand-100 lg:text-lg">
                  Browse available scrap listings in your area and make offers.
                </p>
              </div>
              <div className="hidden sm:flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center group-hover:bg-white/30 transition-colors">
                <Search className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Link>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link
            to="/scrapper/offers"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">My Offers</h3>
                <p className="text-sm text-text-secondary">Track your submitted offers</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
          <Link
            to="/scrapper/pickups"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Pickups</h3>
                <p className="text-sm text-text-secondary">Manage scheduled pickups</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
          <Link
            to="/scrapper/profile"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-200 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">My Profile</h3>
                <p className="text-sm text-text-secondary">Update your collector profile</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-600 transition-colors" />
          </Link>
        </div>

        {/* Empty State */}
        <div className="mt-8 bg-white rounded-2xl border border-surface-200 p-8 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No pickups yet</h3>
          <p className="text-text-secondary mb-6">
            Start discovering nearby scrap to make your first offer.
          </p>
          <Link
            to="/scrapper/discover"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20"
          >
            <Search className="w-5 h-5" />
            Find Scrap Nearby
          </Link>
        </div>
      </main>
    </div>
  )
}
