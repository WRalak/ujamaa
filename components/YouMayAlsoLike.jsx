import React, { useState, useEffect } from 'react'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import Button from './Button'
import LoadingSpinner from './LoadingSpinner'

const YouMayAlsoLike = ({ currentProductId, category, limit = 8 }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    fetchRecommendations()
  }, [currentProductId, category, limit])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        excludeId: currentProductId,
        ...(category && { category })
      })

      const response = await fetch(`/api/products/recommendations?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1
        })
      })

      if (response.ok) {
        // Show success notification
        // You can integrate with toast here
        console.log('Added to cart successfully')
      } else {
        throw new Error('Failed to add to cart')
      }
    } catch (error) {
      console.error('Add to cart error:', error)
      // Show error notification
    }
  }

  const handleAddToWishlist = async (product) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id
        })
      })

      if (response.ok) {
        // Show success notification
        console.log('Added to wishlist successfully')
      } else {
        throw new Error('Failed to add to wishlist')
      }
    } catch (error) {
      console.error('Add to wishlist error:', error)
      // Show error notification
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-6 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load recommendations</p>
          <Button 
            onClick={fetchRecommendations}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 group"
          >
            {/* Product Image */}
            <div className="relative">
              <a href={`/products/${product._id}`}>
                <img
                  src={product.images?.[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg'
                  }}
                />
              </a>
              
              {/* Quick Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleAddToWishlist(product)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  title="Add to Wishlist"
                >
                  <Heart size={16} className="text-gray-600 hover:text-red-500" />
                </button>
              </div>

              {/* Discount Badge */}
              {product.discountPercentage > 0 && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  -{product.discountPercentage}%
                </div>
              )}

              {/* Stock Status */}
              {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute bottom-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  Only {product.stock} left
                </div>
              )}

              {product.stock === 0 && (
                <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              {/* Product Name */}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors">
                <a href={`/products/${product._id}`} className="block">
                  {product.name}
                </a>
              </h3>

              {/* Category */}
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>

              {/* Rating */}
              {product.ratings && product.ratings.count > 0 && (
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < Math.floor(product.ratings.average)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-1">
                    ({product.ratings.count})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through ml-2">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
                variant="primary"
                size="sm"
                fullWidth
                icon={ShoppingCart}
                iconPosition="left"
                className="text-sm"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* View More Button */}
      <div className="text-center mt-8">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/shop'}
        >
          View All Products
        </Button>
      </div>
    </div>
  )
}

export default YouMayAlsoLike
