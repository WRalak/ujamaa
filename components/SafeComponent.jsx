'use client'
import React, { Suspense } from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorBoundary from './ErrorBoundary'

// Safe component wrapper with error boundary and loading states
export default function SafeComponent({ 
  children, 
  fallback = null,
  loadingFallback = <LoadingSpinner />,
  errorBoundary = true
}) {
  if (errorBoundary) {
    return (
      <ErrorBoundary>
        <Suspense fallback={loadingFallback}>
          {children}
        </Suspense>
      </ErrorBoundary>
    )
  }

  return (
    <Suspense fallback={loadingFallback}>
      {children}
    </Suspense>
  )
}

// Safe async component wrapper
export function SafeAsyncComponent({ 
  children, 
  loadingFallback = <LoadingSpinner />,
  errorFallback = <div>Failed to load component</div>
}) {
  return (
    <Suspense fallback={loadingFallback}>
      {children}
    </Suspense>
  )
}
