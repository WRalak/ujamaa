'use client'
import { useState, useEffect } from 'react'

export function useErrorBoundary() {
  const [error, setError] = useState(null)
  const [errorInfo, setErrorInfo] = useState(null)

  const resetError = () => {
    setError(null)
    setErrorInfo(null)
  }

  const captureError = (error, errorInfo) => {
    console.error('Error captured by boundary:', error, errorInfo)
    
    setError(error)
    setErrorInfo(errorInfo)
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error logging service here
      // e.g., Sentry.captureException(error)
    }
  }

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      captureError(new Error(event.reason), { componentStack: 'Unhandled Promise Rejection' })
    }

    // Handle uncaught errors
    const handleError = (event) => {
      console.error('Uncaught error:', event.error)
      captureError(event.error, { componentStack: 'Uncaught Error' })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return {
    error,
    errorInfo,
    hasError: !!error,
    captureError,
    resetError
  }
}
