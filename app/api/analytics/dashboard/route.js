import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AnalyticsService from '@/lib/analyticsService'
import { withAuth, adminOnly } from '@/middleware/auth'
import { withSecurity, generalRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { searchParams } = new URL(request.url)
      const timeRange = searchParams.get('range') || '30d'
      const filters = {}

      // Parse filters
      if (searchParams.get('country')) {
        filters.country = searchParams.get('country')
      }
      if (searchParams.get('device')) {
        filters.device = searchParams.get('device')
      }

      const analytics = await AnalyticsService.getDashboardAnalytics(timeRange, filters)

      return NextResponse.json(analytics)
    } catch (error) {
      console.error('Get analytics dashboard error:', error)
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
