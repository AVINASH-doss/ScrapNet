import { Link } from 'react-router-dom'
import {
  Recycle, ArrowRight, Shield, MapPin, TrendingUp, Truck,
  Star, Package, Leaf, ChevronRight
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">ScrapNet</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-brand-200 text-sm font-medium mb-8 backdrop-blur-sm border border-white/10">
            <Leaf className="w-4 h-4" />
            Making recycling accessible for everyone
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-8">
            Your scrap has{' '}
            <span className="text-brand-300">value.</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-brand-200 max-w-3xl mx-auto mb-12 leading-relaxed">
            We bring the right collector to your doorstep. Compare offers, schedule pickups, and get the best price for your recyclables.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 transition-all shadow-xl shadow-black/10 text-lg"
            >
              <Package className="w-5 h-5" />
              Sell Scrap
            </Link>
            <Link
              to="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 text-lg"
            >
              <Truck className="w-5 h-5" />
              I'm a Scrapper
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 lg:py-32 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              How it works
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Selling your scrap has never been easier. Just four simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: Package,
                title: 'Post your scrap',
                desc: 'Take photos, select the category, and add details about your recyclables.',
              },
              {
                step: '02',
                icon: TrendingUp,
                title: 'Get offers',
                desc: 'Nearby verified collectors will send you competitive offers.',
              },
              {
                step: '03',
                icon: Star,
                title: 'Choose collector',
                desc: 'Compare offers, ratings, and distance. Accept the best deal.',
              },
              {
                step: '04',
                icon: Truck,
                title: 'Schedule pickup',
                desc: 'The collector comes to your door. Get paid and rate the experience.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-white rounded-2xl p-8 shadow-sm border border-surface-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute top-4 right-4 text-4xl font-bold text-surface-100 group-hover:text-brand-100 transition-colors select-none">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ScrapNet */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Why <span className="text-gradient">ScrapNet</span>?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              We make the scrap recycling process convenient, transparent, and trustworthy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: 'Hyperlocal',
                desc: 'Find collectors in your neighborhood. No wasted travel, faster pickups.',
                iconColor: 'text-blue-600',
                iconBg: 'bg-blue-50',
              },
              {
                icon: TrendingUp,
                title: 'Better Prices',
                desc: 'Multiple collectors compete for your scrap. Get the best market price.',
                iconColor: 'text-green-600',
                iconBg: 'bg-green-50',
              },
              {
                icon: Shield,
                title: 'Privacy First',
                desc: 'Your address stays hidden until you accept an offer. Stay in control.',
                iconColor: 'text-purple-600',
                iconBg: 'bg-purple-50',
              },
              {
                icon: Star,
                title: 'Trusted Collectors',
                desc: "Verified profiles, ratings, and reviews. Know who you're dealing with.",
                iconColor: 'text-amber-600',
                iconBg: 'bg-amber-50',
              },
              {
                icon: Truck,
                title: 'Doorstep Pickup',
                desc: 'No need to carry heavy loads. The collector comes to you.',
                iconColor: 'text-teal-600',
                iconBg: 'bg-teal-50',
              },
              {
                icon: Leaf,
                title: 'Eco Impact',
                desc: 'Reduce waste, promote recycling, and contribute to a cleaner planet.',
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-6 rounded-2xl border border-surface-200 hover:border-brand-200 hover:shadow-md transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-text-primary mb-1.5">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-24 lg:py-32 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-brand-200">
              Together, we're building a cleaner future.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: '2,500+', label: 'kg Scrap Collected', icon: '📦' },
              { value: '850+', label: 'Pickups Completed', icon: '🚚' },
              { value: '120+', label: 'Active Collectors', icon: '👷' },
              { value: '1,200+', label: 'Households Connected', icon: '🏠' },
            ].map((stat, i) => (
              <div key={i} className="text-center py-6">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-brand-200 text-sm sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-6">
            Ready to turn your scrap into value?
          </h2>
          <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
            Join thousands of households and collectors already using ScrapNet.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-brand-500/20 text-lg"
          >
            Get Started Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-950 text-brand-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Recycle className="w-5 h-5 text-brand-400" />
              </div>
              <span className="text-lg font-bold text-white">ScrapNet</span>
            </div>
            <p className="text-sm text-brand-300">
              © {new Date().getFullYear()} ScrapNet. Building a cleaner future, one pickup at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
