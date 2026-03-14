import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Queue from '@/models/Queue'
import { withSecurity, adminRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { searchParams } = new URL(request.url)
      const timeRange = searchParams.get('timeRange') || '24h'
      
      const performance = await Queue.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - (timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30) * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: '$type',
            totalItems: { $sum: 1 },
            completedItems: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedItems: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            avgProcessingTime: { $avg: '$actualProcessingTime' },
            slaBreached: {
              $sum: { $cond: ['$slaBreached', 1, 0] }
            }
          }
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $eq: ['$totalItems', 0] },
                0,
                { $multiply: [{ $divide: ['$completedItems', '$totalItems'] }, 100] }
              ]
            },
            failureRate: {
              $cond: [
                { $eq: ['$totalItems', 0] },
                0,
                { $multiply: [{ $divide: ['$failedItems', '$totalItems'] }, 100] }
              ]
            },
            slaBreachRate: {
              $cond: [
                { $eq: ['$totalItems', 0] },
                0,
                { $multiply: [{ $divide: ['$slaBreached', '$totalItems'] }, 100] }
              ]
            }
          }
        }
      ])
      
      return NextResponse.json(performance)
    } catch (error) {
      console.error('Get queue performance error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}
