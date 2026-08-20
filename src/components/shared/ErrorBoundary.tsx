import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Recycle, RefreshCw, Home } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Recycle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
            <p className="text-text-secondary mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-surface-100 rounded-xl p-4 mb-6 overflow-auto max-h-32 text-red-600">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-white text-text-primary font-semibold rounded-xl border border-surface-200 hover:bg-surface-50 transition-all"
              >
                <Home className="w-4 h-4" /> Home
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
