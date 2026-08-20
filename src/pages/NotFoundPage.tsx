import { Link } from 'react-router-dom'
import { Recycle, ArrowLeft, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="text-8xl font-bold text-surface-200 mb-4">404</div>
        <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Page not found</h1>
        <p className="text-text-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  )
}
