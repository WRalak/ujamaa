'use client'
import React from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error logging service here
      // e.g., Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoBack = () => {
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-6">
              <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRefresh}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>
              
              <button
                onClick={this.handleGoBack}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft size={16} />
                Go Back
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white">
                  🐛 Error Details (Development Only)
                </summary>
                <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <div className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
