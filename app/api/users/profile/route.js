import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SellerProfile from '@/models/SellerProfile'
import { withAuth } from '@/middleware/auth'
import { withSecurity, generalRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const user = await User.findById(req.user._id).select('-password')
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Get seller profile if user is a seller
      let sellerProfile = null
      if (user.role === 'seller') {
        sellerProfile = await SellerProfile.findOne({ user: user._id })
      }

      return NextResponse.json({
        user,
        sellerProfile
      })
    } catch (error) {
      console.error('Get profile error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { 
    rateLimitType: 'general',
    requireAuth: true 
  })()
}

export async function PUT(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { name, email, avatar, addresses, phone } = await request.json()

      const user = await User.findById(req.user._id)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Validate email if being updated
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 400 }
          )
        }
      }

      // Update user fields
      const updateData = {}
      if (name) updateData.name = name
      if (email) updateData.email = email
      if (avatar) updateData.avatar = avatar
      if (addresses) updateData.addresses = addresses
      if (phone) updateData.phone = phone

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password')

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: updatedUser
      })
    } catch (error) {
      console.error('Update profile error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { 
    rateLimitType: 'general',
    validateInput: 'user',
    requireAuth: true 
  })()
}
