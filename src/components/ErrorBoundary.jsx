import { Component } from 'react'

export default class ErrorBoundary extends Component {
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
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-4">An unexpected error occurred. Please reload the page.</p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer">
              Reload Page
            </button>
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
