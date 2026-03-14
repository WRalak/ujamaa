import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Queue from '@/models/Queue'
import { withSecurity, adminRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const stats = await Queue.getQueueStats()
      
      return NextResponse.json(stats)
    } catch (error) {
      console.error('Get queue stats error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}
