import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Queue from '@/models/Queue'
import { withSecurity, adminRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type')
      const status = searchParams.get('status')
      const search = searchParams.get('search')
      const page = parseInt(searchParams.get('page')) || 1
      const limit = parseInt(searchParams.get('limit')) || 20
      const skip = (page - 1) * limit

      // Build query
      let query = {}
      
      if (type && type !== 'all') {
        query.type = type
      }
      
      if (status && status !== 'all') {
        query.status = status
      }
      
      if (search) {
        query.$or = [
          { 'referenceId': { $regex: search, $options: 'i' } },
          { 'submittedBy.name': { $regex: search, $options: 'i' } }
        ]
      }

      const items = await Queue.find(query)
        .sort({ priority: -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('submittedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('referenceId')

      const total = await Queue.countDocuments(query)

      return NextResponse.json({
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Get queue items error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}
