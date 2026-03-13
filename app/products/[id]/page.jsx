import { notFound } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import YouMayAlsoLike from '@/components/YouMayAlsoLike'

export default async function ProductPage({ params }) {
  const { id } = params
  
  let product
  
  try {
    await connectDB()
    product = await Product.findById(id).populate('seller', 'businessName')
    
    if (!product || !product.isActive) {
      notFound()
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Product details section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              <img
                src={product.images?.[0] || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg bg-white">
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-lg text-gray-600 mt-2">{product.category}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                KES {product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-gray-500 line-through">
                  KES {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Stock Status */}
            <div>
              {product.stock > 0 ? (
                <p className="text-green-600 font-medium">
                  {product.stock} items in stock
                </p>
              ) : (
                <p className="text-red-600 font-medium">Out of stock</p>
              )}
            </div>

            {/* Seller Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sold by</h3>
              <p className="text-gray-600">{product.seller?.businessName || 'Unknown Seller'}</p>
            </div>

            {/* Add to Cart Button */}
            <button
              disabled={product.stock === 0}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                product.stock === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* You May Also Like Section */}
      <YouMayAlsoLike 
        currentProductId={product._id.toString()}
        category={product.category}
        limit={8}
      />
    </div>
  )
}
