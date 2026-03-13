import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { withAuth } from '@/middleware/auth'
import { withSecurity, generalRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page')) || 1
      const limit = parseInt(searchParams.get('limit')) || 20
      const unreadOnly = searchParams.get('unreadOnly') === 'true'
      const type = searchParams.get('type')

      const result = await Notification.getUserNotifications(req.user._id, {
        page,
        limit,
        unreadOnly,
        type
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error('Get notifications error:', error)
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

export async function POST(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { title, message, type, actionUrl, actionText, priority, metadata, expiresAt } = await request.json()

      if (!title || !message) {
        return NextResponse.json(
          { error: 'Title and message are required' },
          { status: 400 }
        )
      }

      // Only admin can create notifications for other users
      let userId = req.user._id
      if (req.body.userId && req.user.role === 'admin') {
        userId = req.body.userId
      }

      const notification = await Notification.createNotification(userId, {
        title,
        message,
        type: type || 'info',
        actionUrl,
        actionText,
        priority: priority || 'medium',
        metadata: metadata || {},
        expiresAt: expiresAt ? new Date(expiresAt) : null
      })

      return NextResponse.json({
        message: 'Notification created successfully',
        notification
      }, { status: 201 })
    } catch (error) {
      console.error('Create notification error:', error)
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

export async function PUT(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { notificationId, markAllAsRead } = await request.json()

      if (markAllAsRead) {
        await Notification.markAllAsRead(req.user._id)
        
        return NextResponse.json({
          message: 'All notifications marked as read'
        })
      } else if (notificationId) {
        await Notification.markAsRead(notificationId, req.user._id)
        
        return NextResponse.json({
          message: 'Notification marked as read'
        })
      } else {
        return NextResponse.json(
          { error: 'Notification ID or markAllAsRead is required' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Update notification error:', error)
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

export async function DELETE(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { searchParams } = new URL(request.url)
      const notificationId = searchParams.get('id')

      if (!notificationId) {
        return NextResponse.json(
          { error: 'Notification ID is required' },
          { status: 400 }
        )
      }

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: req.user._id
      })

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: 'Notification deleted successfully'
      })
    } catch (error) {
      console.error('Delete notification error:', error)
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
