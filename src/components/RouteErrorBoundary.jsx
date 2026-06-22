import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-400">!</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-4">{this.props.message || 'An unexpected error occurred on this page.'}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer">
                Reload Page
              </button>
              <Link to="/"
                className="px-6 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-semibold transition-all">
                Go Home
              </Link>
            </div>
            {this.state.error && (
              <pre className="mt-4 text-xs text-left text-red-400/70 bg-slate-900 p-3 rounded-xl overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
