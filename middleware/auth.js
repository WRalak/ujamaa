import { NextResponse } from 'next/server'
import AuthService from '@/lib/auth'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'

// Auth middleware for API routes
export async function authenticateToken(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Authorization token required', status: 401 }
    }

    const token = authHeader.split(' ')[1]
    const decoded = AuthService.verifyAccessToken(token)

    if (!decoded) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    // Get fresh user data
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return { error: 'User not found', status: 401 }
    }

    return { user, decoded }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

// Role-based access control
export function authorize(roles) {
  return async (request) => {
    const auth = await authenticateToken(request)
    
    if (auth.error) {
      return auth
    }

    if (!roles.includes(auth.user.role)) {
      return { error: 'Insufficient permissions', status: 403 }
    }

    return auth
  }
}

// Admin only middleware
export const adminOnly = authorize(['admin'])

// Seller or admin middleware
export const sellerOrAdmin = authorize(['seller', 'admin'])

// User or admin middleware
export const userOrAdmin = authorize(['user', 'seller', 'admin'])

// API route wrapper with authentication
export function withAuth(handler, requiredRoles = []) {
  return async (request, context) => {
    try {
      let auth
      
      if (requiredRoles.length > 0) {
        auth = await authorize(requiredRoles)(request)
      } else {
        auth = await authenticateToken(request)
      }

      if (auth.error) {
        return NextResponse.json(
          { error: auth.error },
          { status: auth.status }
        )
      }

      // Add user to request context
      request.user = auth.user
      request.decoded = auth.decoded

      return await handler(request, context)
    } catch (error) {
      console.error('WithAuth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Rate limiting middleware
const rateLimitMap = new Map()

export function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (request) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    for (const [key, requests] of rateLimitMap.entries()) {
      rateLimitMap.set(key, requests.filter(time => time > windowStart))
      if (rateLimitMap.get(key).length === 0) {
        rateLimitMap.delete(key)
      }
    }

    // Check current IP
    const requests = rateLimitMap.get(ip) || []
    
    if (requests.length >= maxRequests) {
      return { 
        error: 'Too many requests, please try again later', 
        status: 429,
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
      }
    }

    // Add current request
    requests.push(now)
    rateLimitMap.set(ip, requests)

    return null // No rate limit hit
  }
}

// Common rate limits
export const authRateLimit = rateLimit(5, 15 * 60 * 1000) // 5 requests per 15 minutes
export const generalRateLimit = rateLimit(100, 15 * 60 * 1000) // 100 requests per 15 minutes
export const strictRateLimit = rateLimit(20, 15 * 60 * 1000) // 20 requests per 15 minutes
