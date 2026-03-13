import { useState, useEffect } from 'react'

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottle(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value)

  useEffect(() => {
    let lastExecuted = Date.now()
    
    const executeThrottle = () => {
      const now = Date.now()
      if (now - lastExecuted >= delay) {
        setThrottledValue(value)
        lastExecuted = now
      }
    }

    const timer = setTimeout(executeThrottle, delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return throttledValue
}
