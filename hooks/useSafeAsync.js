'use client'
import React, { useState, useEffect, useCallback } from 'react'

// Safe async hook with error handling and retry logic
export function useSafeAsync(asyncFn, dependencies = [], options = {}) {
  const {
    initialData = null,
    retryCount = 3,
    retryDelay = 1000,
    onSuccess = null,
    onError = null,
    immediate = true
  } = options

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryAttempts, setRetryAttempts] = useState(0)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await asyncFn(...args)
      
      setData(result)
      setRetryAttempts(0)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      console.error('Async operation failed:', err)
      
      // Retry logic
      if (retryAttempts < retryCount) {
        setRetryAttempts(prev => prev + 1)
        
        setTimeout(() => {
          execute(...args)
        }, retryDelay * Math.pow(2, retryAttempts))
        
        return
      }
      
      setError(err)
      
      if (onError) {
        onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [asyncFn, retryAttempts, retryCount, retryDelay, onSuccess, onError])

  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setLoading(false)
    setRetryAttempts(0)
  }, [initialData])

  const retry = useCallback(() => {
    setRetryAttempts(0)
    execute()
  }, [execute])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, dependencies)

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
    retryAttempts
  }
}

// Safe API call hook
export function useSafeApiCall(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    dependencies = [],
    immediate = true
  } = options

  return useSafeAsync(
    async () => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : null
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    },
    dependencies,
    { immediate, ...options }
  )
}

// Safe mutation hook
export function useSafeMutation(mutationFn, options = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const mutate = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await mutationFn(...args)
      setData(result)
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (err) {
      console.error('Mutation failed:', err)
      setError(err)
      
      if (options.onError) {
        options.onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFn, options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    mutate,
    loading,
    error,
    data,
    reset
  }
}
