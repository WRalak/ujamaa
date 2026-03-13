import { useState, useEffect, useCallback } from 'react'

export function useAnalytics() {
  const [isTracking, setIsTracking] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  // Generate session ID on mount
  useEffect(() => {
    const sessionId = generateSessionId()
    setSessionId(sessionId)
    setIsTracking(true)
  }, [])

  // Track page view
  const trackPageView = useCallback((pageData) => {
    if (!isTracking) return

    const eventData = {
      url: window.location.href,
      title: document.title,
      path: window.location.pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    }

    // Get device information
    const deviceInfo = getDeviceInfo()
    const locationInfo = getLocationInfo()
    const performanceInfo = getPerformanceInfo()

    const fullPageData = {
      ...pageData,
      ...eventData,
      device: deviceInfo,
      location: locationInfo,
      performance: performanceInfo,
      sessionId
    }

    // Send to analytics API
    sendToAnalytics('page_view', fullPageData)
  }, [isTracking, sessionId])

  // Track user action
  const trackAction = useCallback((action, data = {}) => {
    if (!isTracking) return

    const eventData = {
      action,
      ...data,
      timestamp: new Date().toISOString()
    }

    sendToAnalytics('click', eventData)
  }, [isTracking])

  // Track form interaction
  const trackForm = useCallback((formType, status, formData = {}) => {
    if (!isTracking) return

    const eventData = {
      formType,
      status,
      ...formData,
      timestamp: new Date().toISOString()
    }

    sendToAnalytics(status === 'submit' ? 'form_submit' : 'form_start', eventData)
  }, [isTracking])

  // Track search
  const trackSearch = useCallback((searchData) => {
    if (!isTracking) return

    const eventData = {
      ...searchData,
      timestamp: new Date().toISOString()
    }

    sendToAnalytics('search', eventData)
  }, [isTracking])

  // Track e-commerce event
  const trackEcommerce = useCallback((eventType, ecommerceData, additionalData = {}) => {
    if (!isTracking) return

    const eventData = {
      ...ecommerceData,
      ...additionalData,
      timestamp: new Date().toISOString()
    }

    sendToAnalytics(eventType, eventData)
  }, [isTracking])

  // Track performance
  const trackPerformance = useCallback((performanceData) => {
    if (!isTracking) return

    const eventData = {
      ...performanceData,
      timestamp: new Date().toISOString()
    }

    sendToAnalytics('performance', eventData)
  }, [isTracking])

  // Track error
  const trackError = useCallback((errorData) => {
    if (!isTracking) return

    const eventData = {
      ...errorData,
      timestamp: new Date().toISOString()
    }

    sendToAnalytics('error', eventData)
  }, [isTracking])

  // Helper function to send data to analytics API
  const sendToAnalytics = useCallback(async (eventType, data) => {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType,
          data
        })
      })

      if (!response.ok) {
        console.error('Analytics tracking failed:', await response.text())
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [])

  // Generate session ID
  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Get device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent
  
    const device = {
      type: getDeviceType(),
      os: getOperatingSystem(),
      browser: getBrowser(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/iP(hone|od)|IEMobile|webOS|Android|iPhone|iPad|iPod|BlackBerry|BB10|PlayBook|Tablet|Kindle|Silk|Opera Mini|IEMobile|Mobi|Opera Mini/iP(hone|od)|IEMobile|Mobi|Opera Mini|IEMobile|Mobi|Opera Mini/iP(hone|od)|IEMobile|Mobi|Opera Mini|webOS|Android|iPhone|iPad|iPod|BlackBerry|BB10|PlayBook|Tablet|Kindle|Silk|Opera Mini|IEMobile|Mobi|Opera Mini/iP(hone|od)|IEMobile|Mobi|Opera Mini|webOS|Android|iPhone|iPad|iPod|BlackBerry|BB10|PlayBook|Tablet|Kindle|Silk|Opera Mini|IEMobile|Mobi|Opera Mini/iP(hone|od)|IEMobile|Mobi|Opera Mini|webOS|Android|iPhone|iPad|iPod|BlackBerry|BB10|PlayBook|Tablet|Kindle|Silk|Opera Mini|IEMobile|Mobi|Opera Mini/iP(hone|od)|IEMobile|Mobi|Opera Mini|webOS|Android|iPhone|iPad|iPod|BlackBerry|BB10|PlayBook|Tablet|Kindle|Silk|Opera Mini|IEMobile|Mobi|Opera Mini/iP(hone|od)|I   }
    }

    return device
  }

  // Get operating system
  const getOperatingSystem = () => {
    const userAgent = navigator.userAgent
    let os = 'Unknown'

    if (userAgent.indexOf('Win') !== -1) {
      os = 'Windows'
    } else if (userAgent.indexOf('Mac') !== -1) {
      os = 'macOS'
    } else if (userAgent.indexOf('Linux') !== -1) {
      os = 'Linux'
    } else if (userAgent.indexOf('Android') !== -1) {
      os = 'Android'
    } else if (userAgent.indexOf('iOS') !== -1) {
      os = 'iOS'
    }

    return os
  }

  // Get browser
  const getBrowser = () => {
    const userAgent = navigator.userAgent
    let browser = 'Unknown'

    if (userAgent.indexOf('Chrome') !== -1) {
      browser = 'Chrome'
    } else if (userAgent.indexOf('Firefox') !== -1) {
      browser = 'Firefox'
    } else if (userAgent.indexOf('Safari') !== -1) {
      browser = 'Safari'
    } else if (userAgent.indexOf('Edge') !== -1) {
      browser = 'Edge'
    } else if (userAgent.indexOf('Opera') !== -1) {
      browser = 'Opera'
    }

    return browser
  }

  // Get device type
  const getDeviceType = () => {
    const userAgent = navigator.userAgent

    if (/tablet|ipad|playbook|silk|android(?!.*mobile)|pdx|kindle|silk|mobile|phone/.test(userAgent.toLowerCase())) {
      return 'tablet'
    } else if (/mobile|phone|android|iphone|ipod|blackberry|iemobile|opera mini|windows phone|windows mobile|windows phone|iemobile|opera mini|mobile|phone|android|iphone|ipod|blackberry|bb10|playbook|tablet|kindle|silk|opera mini|iemobile|mobile|phone|android|iphone|ipod|blackberry|bb10|playbook|tablet|kindle|silk|opera mini|iemobile|mobile|phone|android|iphone|ipod|blackberry|bb10|playbook|tablet|kindle|silk|opera mini|iemobile|mobile|phone|android|iphone|ipod|blackberry|bb10|playbook|tablet|kindle|silk|opera mini|iemobile|mobile|phone|android|iphone|ipod| ')/.test(userAgent.toLowerCase())) {
      return 'mobile'
    } else {
      return 'desktop'
    }
  }

  return {
        country: 'KE', // Default to Kenya
        city: 'Nairobi', // Default to Nairobi
        region: 'Nairobi County'
      }
    }

    // Get performance information
    const getPerformanceInfo = () => {
      if (typeof window === 'undefined' || !window.performance) {
        return {}
      }

      const navigation = window.performance.getNavigation()
      const paint = window.performance.getPaintTiming()

      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        firstContentfulPaint: paint.firstContentfulPaint,
        largestContentfulPaint: paint.largestContentfulPaint,
        cumulativeLayoutShift: paint.cumulativeLayoutShift,
        firstInputDelay: paint.firstInputDelay
      }
    }

    return {
      isTracking,
      sessionId,
      trackPageView,
      trackAction,
      trackForm,
      trackSearch,
      trackEcommerce,
      trackPerformance,
      trackError,
      setTracking: setIsTracking
    }
  }
}
