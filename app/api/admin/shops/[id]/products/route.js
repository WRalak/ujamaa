import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { withSecurity, adminRateLimit } from '@/middleware/security'

export async function GET(request, { params }) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { id } = params
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page')) || 1
      const limit = parseInt(searchParams.get('limit')) || 20
      const skip = (page - 1) * limit

      const products = await Product.find({ seller: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('seller', 'businessName')

      const total = await Product.countDocuments({ seller: id })

      return NextResponse.json({
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Get shop products error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}
