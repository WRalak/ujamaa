import { NextResponse } from 'next/server'
import SecurityService from '@/lib/security'
import UserActivity from '@/models/UserActivity'

// Security middleware for API routes
export function withSecurity(handler, options = {}) {
  const {
    requireAuth = false,
    rateLimitType = 'general',
    validateInput = null,
    sanitizeInput = true,
    logActivity = true
  } = options

  return async (request, context) => {
    try {
      // Rate limiting
      const rateLimitConfig = SecurityService.getRateLimitConfig(rateLimitType)
      const rateLimitResult = rateLimitMiddleware(request, rateLimitConfig)
      
      if (rateLimitResult) {
        // Log security event
        SecurityService.logSecurityEvent('rate_limit_exceeded', {
          ip: request.ip,
          userAgent: request.headers.get('user-agent'),
          path: request.nextUrl.pathname
        })

        return NextResponse.json(
          { error: rateLimitConfig.message },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter
            }
          }
        )
      }

      // Input sanitization
      let requestData = {}
      if (request.method !== 'GET') {
        try {
          requestData = await request.json()
          
          if (sanitizeInput) {
            requestData = sanitizeObject(requestData)
          }

          // Input validation
          if (validateInput) {
            const validation = SecurityService.validateInput(requestData, validateInput)
            if (!validation.isValid) {
              SecurityService.logSecurityEvent('invalid_input', {
                errors: validation.errors,
                path: request.nextUrl.pathname
              })

              return NextResponse.json(
                { 
                  error: 'Validation failed', 
                  details: validation.errors 
                },
                { status: 400 }
              )
            }
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON format' },
            { status: 400 }
          )
        }
      }

      // Check for suspicious activity
      const suspiciousPatterns = [
        request.nextUrl.search,
        request.headers.get('user-agent'),
        JSON.stringify(requestData)
      ].join(' ')

      if (SecurityService.detectSuspiciousActivity(suspiciousPatterns)) {
        SecurityService.logSecurityEvent('suspicious_activity', {
          ip: request.ip,
          userAgent: request.headers.get('user-agent'),
          path: request.nextUrl.pathname,
          query: request.nextUrl.search,
          body: requestData
        })

        return NextResponse.json(
          { error: 'Request contains suspicious content' },
          { status: 400 }
        )
      }

      // Log activity
      if (logActivity && request.user) {
        await UserActivity.create({
          user: request.user._id,
          action: getActivityFromPath(request.nextUrl.pathname),
          metadata: {
            method: request.method,
            path: request.nextUrl.pathname,
            ip: request.ip,
            userAgent: request.headers.get('user-agent')
          },
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent')
        })
      }

      // Call the handler with sanitized data
      const modifiedRequest = {
        ...request,
        body: requestData,
        sanitized: true
      }

      return await handler(modifiedRequest, context)
    } catch (error) {
      console.error('Security middleware error:', error)
      
      SecurityService.logSecurityEvent('middleware_error', {
        error: error.message,
        path: request.nextUrl.pathname
      })

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Rate limiting middleware
function rateLimitMiddleware(request, config) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `rate_limit_${ip}_${config.windowMs}`
  
  // This is a simplified version. In production, use Redis or a proper rate limiting store
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // For demo purposes, we'll use a simple in-memory store
  // In production, replace this with Redis or another distributed store
  const store = global.rateLimitStore || new Map()
  global.rateLimitStore = store
  
  const requests = store.get(key) || []
  
  // Clean old requests
  const validRequests = requests.filter(time => time > windowStart)
  store.set(key, validRequests)
  
  if (validRequests.length >= config.max) {
    const oldestRequest = Math.min(...validRequests)
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000)
    
    return { retryAfter }
  }
  
  // Add current request
  validRequests.push(now)
  store.set(key, validRequests)
  
  return null
}

// Sanitize object recursively
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = SecurityService.sanitizeInput(value)
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Get activity name from path
function getActivityFromPath(path) {
  const activityMap = {
    '/api/auth/login': 'login',
    '/api/auth/register': 'register',
    '/api/auth/logout': 'logout',
    '/api/products': 'view_products',
    '/api/orders': 'view_orders',
    '/api/cart': 'view_cart',
    '/api/payments': 'initiate_payment',
    '/api/payouts': 'view_payouts'
  }

  for (const [route, activity] of Object.entries(activityMap)) {
    if (path.startsWith(route)) {
      return activity
    }
  }

  return 'api_request'
}

// CSRF protection middleware
export function withCSRF(handler) {
  return async (request, context) => {
    if (request.method === 'GET') {
      // Generate CSRF token for GET requests
      const token = SecurityService.generateCSRFToken()
      
      // Store token in session or database
      // For demo, we'll return it in a cookie
      const response = await handler(request, context)
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json()
        data.csrfToken = token
        return new NextResponse.json(data, {
          status: response.status,
          headers: {
            ...response.headers,
            'Set-Cookie': `csrf_token=${token}; HttpOnly; Secure; SameSite=Strict`
          }
        })
      }
      
      return response
    }

    // Validate CSRF token for non-GET requests
    const token = request.headers.get('x-csrf-token')
    const cookieToken = request.cookies.get('csrf_token')?.value

    if (!token || !cookieToken || !SecurityService.validateCSRFToken(token, cookieToken)) {
      SecurityService.logSecurityEvent('csrf_attempt', {
        ip: request.ip,
        path: request.nextUrl.pathname,
        method: request.method
      })

      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    return await handler(request, context)
  }
}

// IP whitelist middleware
export function withIPWhitelist(allowedIPs = []) {
  return function(handler) {
    return async (request, context) => {
      const ip = request.ip || request.headers.get('x-forwarded-for')
      
      if (!ip || (allowedIPs.length > 0 && !allowedIPs.includes(ip))) {
        SecurityService.logSecurityEvent('unauthorized_ip', {
          ip,
          path: request.nextUrl.pathname
        })

        return NextResponse.json(
          { error: 'Access denied from this IP address' },
          { status: 403 }
        )
      }

      return await handler(request, context)
    }
  }
}

// File upload security middleware
export function withFileUpload(allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) {
  return function(handler) {
    return async (request, context) => {
      if (request.method !== 'POST') {
        return await handler(request, context)
      }

      const formData = await request.formData()
      const file = formData.get('file')

      if (file) {
        const validation = SecurityService.validateFileUpload(file, allowedTypes, maxSize)
        
        if (!validation.isValid) {
          SecurityService.logSecurityEvent('malicious_file_upload', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            errors: validation.errors
          })

          return NextResponse.json(
            { 
              error: 'File validation failed', 
              details: validation.errors 
            },
            { status: 400 }
          )
        }
      }

      return await handler(request, context)
    }
  }
}
