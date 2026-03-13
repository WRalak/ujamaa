import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Review from '@/models/Review'
import Order from '@/models/Order'
import { withAuth, userOrAdmin } from '@/middleware/auth'
import { withSecurity, generalRateLimit } from '@/middleware/security'

export async function GET(request, { params }) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page')) || 1
      const limit = parseInt(searchParams.get('limit')) || 10
      const rating = searchParams.get('rating')

      // Build query
      let query = { 
        product: params.id,
        status: 'approved'
      }

      if (rating) {
        query.rating = parseInt(rating)
      }

      const skip = (page - 1) * limit

      const reviews = await Review.find(query)
        .populate('user', 'name avatar')
        .populate('response.respondedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const total = await Review.countDocuments(query)

      return NextResponse.json({
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Get reviews error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'general' })()
}

export async function POST(request, { params }) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { rating, title, comment, images } = await request.json()

      // Validate input
      if (!rating || !title || !comment) {
        return NextResponse.json(
          { error: 'Rating, title, and comment are required' },
          { status: 400 }
        )
      }

      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }

      // Check if product exists
      const product = await Product.findById(params.id)
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Check if user has a completed order for this product
      const order = await Order.findOne({
        user: req.user._id,
        'orderItems.product': params.id,
        orderStatus: 'delivered'
      })

      if (!order) {
        return NextResponse.json(
          { error: 'You can only review products you have purchased and received' },
          { status: 400 }
        )
      }

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        user: req.user._id,
        product: params.id,
        order: order._id
      })

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        )
      }

      // Create review
      const review = await Review.create({
        user: req.user._id,
        product: params.id,
        order: order._id,
        rating,
        title,
        comment,
        images: images || [],
        verified: true
      })

      // Populate user data
      await review.populate('user', 'name avatar')

      return NextResponse.json({
        message: 'Review submitted successfully',
        review
      }, { status: 201 })
    } catch (error) {
      console.error('Create review error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { 
    rateLimitType: 'general',
    validateInput: 'product',
    requireAuth: true 
  })()
}
