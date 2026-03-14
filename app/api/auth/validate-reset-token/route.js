import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { withSecurity, authRateLimit } from '@/middleware/security'

export async function POST(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { token } = await request.json()

      if (!token) {
        return NextResponse.json(
          { error: 'Reset token is required' },
          { status: 400 }
        )
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      if (!decoded || decoded.type !== 'password_reset') {
        return NextResponse.json(
          { error: 'Invalid reset token' },
          { status: 400 }
        )
      }

      // Find user with valid reset token
      const user = await User.findOne({
        _id: decoded.userId,
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: 'Token is valid',
        valid: true
      })
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }

      console.error('Validate reset token error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'auth' })()
}
