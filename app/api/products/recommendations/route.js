import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { withSecurity, generalRateLimit } from '@/middleware/security'

export async function GET(request) {
  return withSecurity(async (req) => {
    try {
      await connectDB()

      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit')) || 8
      const excludeId = searchParams.get('excludeId')
      const category = searchParams.get('category')
      const minPrice = searchParams.get('minPrice')
      const maxPrice = searchParams.get('maxPrice')
      const sortBy = searchParams.get('sortBy') || 'relevance'

      // Build query
      let query = {
        isActive: true,
        stock: { $gt: 0 }
      }

      // Exclude current product
      if (excludeId) {
        query._id = { $ne: excludeId }
      }

      // Filter by category
      if (category) {
        query.category = category
      }

      // Price range
      if (minPrice || maxPrice) {
        query.price = {}
        if (minPrice) query.price.$gte = parseFloat(minPrice)
        if (maxPrice) query.price.$lte = parseFloat(maxPrice)
      }

      // Sort options
      let sortOptions = {}
      switch (sortBy) {
        case 'price_low':
          sortOptions = { price: 1 }
          break
        case 'price_high':
          sortOptions = { price: -1 }
          break
        case 'newest':
          sortOptions = { createdAt: -1 }
          break
        case 'rating':
          sortOptions = { 'ratings.average': -1 }
          break
        case 'popular':
          sortOptions = { soldCount: -1 }
          break
        case 'relevance':
        default:
          sortOptions = { 
            'ratings.average': -1, 
            soldCount: -1, 
            createdAt: -1 
          }
          break
      }

      // Get recommendations with multiple strategies
      let recommendations = []

      // Strategy 1: Same category products
      if (category) {
        const categoryProducts = await Product.find({
          ...query,
          category
        })
        .sort(sortOptions)
        .limit(Math.ceil(limit / 2))
        .populate('seller', 'businessName')
        .lean()

        recommendations.push(...categoryProducts)
      }

      // Strategy 2: Similar price range
      if (recommendations.length < limit) {
        const remainingLimit = limit - recommendations.length
        
        // Get price range from similar products
        let priceRangeQuery = { ...query }
        if (recommendations.length > 0) {
          const avgPrice = recommendations.reduce((sum, p) => sum + p.price, 0) / recommendations.length
          const minRange = avgPrice * 0.7
          const maxRange = avgPrice * 1.3
          priceRangeQuery.price = { $gte: minRange, $lte: maxRange }
        }

        const priceRangeProducts = await Product.find(priceRangeQuery)
          .sort(sortOptions)
          .limit(remainingLimit)
          .populate('seller', 'businessName')
          .lean()

        recommendations.push(...priceRangeProducts)
      }

      // Strategy 3: Top rated products if still need more
      if (recommendations.length < limit) {
        const remainingLimit = limit - recommendations.length
        const topRatedQuery = { ...query }
        
        // Remove already recommended products
        if (recommendations.length > 0) {
          const recommendedIds = recommendations.map(p => p._id)
          topRatedQuery._id = { $nin: [...(topRatedQuery._id?.$ne ? [topRatedQuery._id.$ne] : []), ...recommendedIds] }
        }

        const topRatedProducts = await Product.find(topRatedQuery)
          .sort({ 'ratings.average': -1, 'ratings.count': -1 })
          .limit(remainingLimit)
          .populate('seller', 'businessName')
          .lean()

        recommendations.push(...topRatedProducts)
      }

      // Remove duplicates and limit to requested amount
      const uniqueRecommendations = recommendations
        .filter((product, index, self) => 
          index === self.findIndex((p) => p._id.toString() === product._id.toString())
        )
        .slice(0, limit)

      // Calculate discount percentage if applicable
      const processedProducts = uniqueRecommendations.map(product => {
        const processed = { ...product }
        
        // Calculate discount
        if (product.originalPrice && product.originalPrice > product.price) {
          processed.discountPercentage = Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) * 100
          )
        } else {
          processed.discountPercentage = 0
        }

        // Ensure images array exists
        processed.images = product.images || []

        return processed
      })

      return NextResponse.json({
        products: processedProducts,
        count: processedProducts.length,
        strategies: {
          category: category ? 'enabled' : 'disabled',
          priceRange: 'enabled',
          topRated: 'enabled'
        }
      })
    } catch (error) {
      console.error('Get recommendations error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'general' })()
}
