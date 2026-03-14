import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { withSecurity, authRateLimit } from '@/middleware/security'
import { generateToken } from '@/lib/security'

export async function POST(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { email } = await request.json()

      // Validate email
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }

      // Find user by email
      const user = await User.findOne({ 
        email: email.toLowerCase().trim() 
      })

      // Don't reveal if email exists or not for security
      if (!user) {
        // Still return success to prevent email enumeration
        return NextResponse.json({
          message: 'If an account with this email exists, password reset instructions have been sent.',
          success: true
        })
      }

      // Generate reset token
      const resetToken = generateToken({
        userId: user._id.toString(),
        type: 'password_reset',
        expiresIn: '1h' // 1 hour expiry
      })

      // Create reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

      // TODO: Send email with reset link
      // For now, just log it (in production, integrate with email service)
      console.log('Password reset link:', resetUrl)
      
      // Update user with reset token and expiry
      user.passwordResetToken = resetToken
      user.passwordResetExpires = Date.now() + 3600000 // 1 hour
      await user.save()

      return NextResponse.json({
        message: 'If an account with this email exists, password reset instructions have been sent.',
        success: true
      })
    } catch (error) {
      console.error('Forgot password error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'auth' })()
}
