import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import SellerProfile from '@/models/SellerProfile'
import Payment from '@/models/Payment'
import { withAuth, adminOnly } from '@/middleware/auth'
import { withSecurity, generalRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { searchParams } = new URL(request.url)
      const period = searchParams.get('period') || 'month'
      const sellerId = searchParams.get('sellerId')

      // Calculate date range
      const now = new Date()
      let startDate

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      // Base match condition
      const dateMatch = {
        createdAt: { $gte: startDate, $lte: now }
      }

      let stats = {}

      if (req.user.role === 'admin') {
        // Admin gets all stats
        stats = await getAdminStats(dateMatch, sellerId)
      } else if (req.user.role === 'seller') {
        // Seller gets their own stats
        stats = await getSellerStats(req.user._id, dateMatch)
      } else {
        // Regular user gets their personal stats
        stats = await getUserStats(req.user._id, dateMatch)
      }

      return NextResponse.json(stats)
    } catch (error) {
      console.error('Get dashboard stats error:', error)
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

async function getAdminStats(dateMatch, sellerId) {
  const [
    totalOrders,
    totalRevenue,
    totalUsers,
    totalProducts,
    totalSellers,
    recentOrders,
    topProducts,
    revenueByPeriod
  ] = await Promise.all([
    // Total orders
    Order.countDocuments({
      ...dateMatch,
      ...(sellerId && { seller: sellerId })
    }),
    
    // Total revenue
    Order.aggregate([
      {
        $match: {
          ...dateMatch,
          orderStatus: 'delivered',
          ...(sellerId && { seller: sellerId })
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]),
    
    // Total users
    User.countDocuments({
      createdAt: { ...dateMatch }
    }),
    
    // Total products
    Product.countDocuments({
      ...dateMatch,
      ...(sellerId && { seller: sellerId })
    }),
    
    // Total sellers
    SellerProfile.countDocuments({
      verificationStatus: 'verified'
    }),
    
    // Recent orders
    Order.find({
      ...dateMatch,
      ...(sellerId && { seller: sellerId })
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10),
    
    // Top products
    Product.aggregate([
      {
        $match: {
          ...dateMatch,
          ...(sellerId && { seller: sellerId })
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'orderItems.product',
          as: 'orders'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          price: 1,
          images: 1,
          orderCount: 1
        }
      }
    ]),
    
    // Revenue by period
    Order.aggregate([
      {
        $match: {
          ...dateMatch,
          orderStatus: 'delivered',
          ...(sellerId && { seller: sellerId })
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
  ])

  return {
    overview: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      totalProducts,
      totalSellers
    },
    recentOrders,
    topProducts,
    revenueByPeriod
  }
}

async function getSellerStats(userId, dateMatch) {
  const [
    sellerProfile,
    orders,
    revenue,
    products,
    recentOrders,
    payoutSummary
  ] = await Promise.all([
    SellerProfile.findOne({ user: userId }),
    Order.find({
      seller: userId,
      ...dateMatch
    }),
    Order.aggregate([
      {
        $match: {
          seller: userId,
          orderStatus: 'delivered',
          ...dateMatch
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]),
    Product.countDocuments({
      seller: userId,
      ...dateMatch
    }),
    Order.find({
      seller: userId,
      ...dateMatch
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10),
    
    // Payout summary
    Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { ...dateMatch }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$fee' },
          count: { $sum: 1 }
        }
      }
    ])
  ])

  return {
    sellerProfile,
    stats: {
      totalOrders: revenue[0]?.count || 0,
      totalRevenue: revenue[0]?.total || 0,
      totalProducts: products,
      averageOrderValue: revenue[0]?.count > 0 ? revenue[0]?.total / revenue[0]?.count : 0
    },
    recentOrders,
    payoutSummary: payoutSummary[0] || { totalAmount: 0, totalFees: 0, count: 0 }
  }
}

async function getUserStats(userId, dateMatch) {
  const [
    orders,
    wishlist,
    reviews,
    recentOrders
  ] = await Promise.all([
    Order.countDocuments({
      user: userId,
      ...dateMatch
    }),
    // Wishlist count (assuming Wishlist model exists)
    0, // Placeholder - implement when Wishlist model is ready
    Review.countDocuments({
      user: userId,
      ...dateMatch
    }),
    Order.find({
      user: userId,
      ...dateMatch
    })
    .populate('orderItems.product')
    .sort({ createdAt: -1 })
    .limit(5)
  ])

  return {
    stats: {
      totalOrders: orders,
      totalReviews: reviews,
      totalWishlist: wishlist
    },
    recentOrders
  }
}
