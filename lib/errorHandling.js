// Global error handling utilities
import React, { useState } from 'react'

// API error handler wrapper
export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res)
    } catch (error) {
      console.error('API Error:', error)
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      return res.status(error.status || 500).json({
        success: false,
        error: isDevelopment ? error.message : 'Internal server error',
        ...(isDevelopment && { stack: error.stack })
      })
    }
  }
}

// Database connection error handler
export function handleDatabaseError(error) {
  console.error('Database Error:', error)
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message)
    return {
      status: 400,
      message: 'Validation Error',
      errors
    }
  }
  
  if (error.code === 11000) {
    return {
      status: 409,
      message: 'Duplicate entry',
      field: Object.keys(error.keyValue)[0]
    }
  }
  
  if (error.name === 'CastError') {
    return {
      status: 400,
      message: 'Invalid ID format'
    }
  }
  
  return {
    status: 500,
    message: 'Database operation failed'
  }
}

// Async function error wrapper
export function safeAsync(fn) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error('Async Error:', error)
      throw error
    }
  }
}

// Promise error handler
export function handlePromiseError(promise, fallback = null) {
  return promise
    .then(data => data)
    .catch(error => {
      console.error('Promise Error:', error)
      return fallback
    })
}

// Component error handler hook
export function useErrorHandler() {
  const [error, setError] = useState(null)
  
  const resetError = () => setError(null)
  
  const captureError = (error) => {
    console.error('Component Error:', error)
    setError(error)
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error logging service here
    }
  }
  
  return { error, captureError, resetError }
}

// Network error handler
export function handleNetworkError(error) {
  if (!navigator.onLine) {
    return {
      status: 0,
      message: 'You are offline. Please check your internet connection.'
    }
  }
  
  if (error.name === 'AbortError') {
    return {
      status: 408,
      message: 'Request timeout. Please try again.'
    }
  }
  
  if (error.response) {
    // Server responded with error status
    return {
      status: error.response.status,
      message: error.response.data?.error || 'Server error occurred'
    }
  }
  
  if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error. Please check your connection.'
    }
  }
  
  return {
    status: 500,
    message: 'An unexpected error occurred'
  }
}

// Form validation error handler
export function handleFormError(error) {
  if (error.name === 'ValidationError') {
    const fieldErrors = {}
    Object.keys(error.errors).forEach(field => {
      fieldErrors[field] = error.errors[field].message
    })
    return {
      type: 'validation',
      message: 'Please check the form for errors',
      fieldErrors
    }
  }
  
  return {
    type: 'general',
    message: error.message || 'An error occurred'
  }
}

// Retry mechanism for failed operations
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries - 1) {
        break
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError
}

// Graceful degradation for missing features
export function withGracefulDegradation(feature, fallback) {
  try {
    return feature()
  } catch (error) {
    console.warn('Feature not available, using fallback:', error.message)
    return fallback
  }
}

// Service Worker error handling
export function handleServiceWorkerError(error) {
  console.error('Service Worker Error:', error)
  
  // Unregister service worker if it fails
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister()
    })
  }
}
