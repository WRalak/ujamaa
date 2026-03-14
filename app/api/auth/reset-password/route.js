import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { withSecurity, authRateLimit } from '@/middleware/security'

export async function POST(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { token, password, confirmPassword } = await request.json()

      // Validate inputs
      if (!token || !password || !confirmPassword) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        )
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: 'Passwords do not match' },
          { status: 400 }
        )
      }

      // Validate password strength
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        )
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return NextResponse.json(
          { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
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

      // Hash new password
      const salt = await bcryptjs.genSalt(12)
      const hashedPassword = await bcryptjs.hash(password, salt)

      // Update user password and clear reset token
      await User.findByIdAndUpdate(user._id, {
        $set: {
          password: hashedPassword,
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
          lastPasswordReset: new Date()
        }
      })

      return NextResponse.json({
        message: 'Password has been reset successfully',
        success: true
      })
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }

      console.error('Reset password error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'auth' })()
}
