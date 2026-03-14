import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Product from '@/models/Product'
import { withSecurity, adminRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search')
      const status = searchParams.get('status')
      const page = parseInt(searchParams.get('page')) || 1
      const limit = parseInt(searchParams.get('limit')) || 20
      const skip = (page - 1) * limit

      // Build query
      let query = { role: 'seller' }
      
      if (search) {
        query.$or = [
          { 'businessName': { $regex: search, $options: 'i' } },
          { 'ownerName': { $regex: search, $options: 'i' } },
          { 'ownerEmail': { $regex: search, $options: 'i' } }
        ]
      }
      
      if (status && status !== 'all') {
        query.verificationStatus = status
      }

      // Get shops with product counts
      const shops = await User.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'seller',
            as: 'products'
          }
        },
        {
          $addFields: {
            productCount: { $size: '$products' }
          }
        },
        {
          $addFields: {
            totalSales: {
              $sum: {
                $cond: {
                  if: { $gt: ['$products', null] },
                  then: { $sum: '$products.soldCount' },
                  else: 0
                }
              }
            },
            averageRating: {
              $avg: {
                $cond: {
                  if: { $gt: ['$products', null] },
                  then: { $avg: '$products.ratings.average' },
                  else: 0
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            businessName: 1,
            ownerName: 1,
            ownerEmail: 1,
            ownerPhone: 1,
            category: 1,
            location: 1,
            verificationStatus: 1,
            createdAt: 1,
            productCount: 1,
            totalSales: 1,
            averageRating: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])

      const total = await User.countDocuments(query)

      return NextResponse.json({
        shops,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Get shops error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}
