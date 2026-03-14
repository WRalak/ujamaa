import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { withSecurity, adminRateLimit } from '@/middleware/security'

export async function DELETE(request, { params }) {
  return withSecurity(async (req) => {
    try {
      await connectDB()
      
      const { id, productId } = params

      const product = await Product.findOneAndDelete({ _id: productId })
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: 'Product deleted successfully'
      })
    } catch (error) {
      console.error('Delete product error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'admin' })()
}
