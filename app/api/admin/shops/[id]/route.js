import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Product from '@/models/Product'
import { withSecurity, adminRateLimit } from '@/middleware/security'

export async function GET(request, { params }) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { id } = params

      // Get shop details with product count
      const shop = await User.aggregate([
        { $match: { _id: id, role: 'seller' } },
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
        }
      ])

      if (!shop || shop.length === 0) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        shop: shop[0]
      })
    } catch (error) {
      console.error('Get shop error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}

export async function PUT(request, { params }) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { id } = params
      const { status } = await request.json()

      if (!status || !['pending', 'verified', 'rejected'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }

      const shop = await User.findOneAndUpdate(
        { _id: id, role: 'seller' },
        { verificationStatus: status },
        { new: true }
      )

      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: `Shop status updated to ${status}`,
        shop
      })
    } catch (error) {
      console.error('Update shop status error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}

export async function DELETE(request, { params }) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { id } = params

      // Delete shop and all associated products
      const shop = await User.findOne({ _id: id, role: 'seller' })
      
      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        )
      }

      // Delete all products from this shop
      await Product.deleteMany({ seller: id })
      
      // Delete the shop
      await User.findByIdAndDelete(id)

      return NextResponse.json({
        message: 'Shop deleted successfully'
      })
    } catch (error) {
      console.error('Delete shop error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}
