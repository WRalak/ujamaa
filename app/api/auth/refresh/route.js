import { NextResponse } from 'next/server'
import AuthService from '@/lib/auth'
import { generalRateLimit } from '@/middleware/auth'

export async function POST(request) {
  try {
    // Rate limiting
    const rateLimitResult = generalRateLimit(request)
    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: rateLimitResult.status,
          headers: {
            'Retry-After': rateLimitResult.retryAfter
          }
        }
      )
    }

    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      )
    }

    const tokens = await AuthService.refreshTokens(refreshToken)

    return NextResponse.json({
      message: 'Tokens refreshed successfully',
      tokens
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh tokens' },
      { status: 401 }
    )
  }
}
