'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
          <div className="w-full max-w-[1800px] mx-auto mx-5">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Settings Error</h2>
                <p className="text-zinc-400 mb-4">An error occurred while loading settings. Please try again.</p>
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={this.resetError}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
                {this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="text-zinc-500 cursor-pointer">Error Details</summary>
                    <pre className="mt-2 text-xs text-zinc-600 bg-zinc-800 p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
