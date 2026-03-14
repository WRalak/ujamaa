'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Users, TrendingUp, Calendar, MapPin, Mail, Phone, Star, Eye, Edit, Trash2, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'

export default function ShopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const shopId = params.id
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')
  const { addToast } = useToast()

  useEffect(() => {
    fetchShopDetails()
  }, [shopId])

  const fetchShopDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch shop details
      const shopResponse = await fetch(`/api/admin/shops/${shopId}`)
      const shopData = await shopResponse.json()
      
      if (shopResponse.ok) {
        setShop(shopData.shop)
        
        // Fetch shop products
        const productsResponse = await fetch(`/api/admin/shops/${shopId}/products`)
        const productsData = await productsResponse.json()
        
        if (productsResponse.ok) {
          setProducts(productsData.products || [])
        }
      } else {
        addToast({
          type: 'error',
          message: shopData.error || 'Failed to fetch shop details'
        })
        router.push('/admin/shops')
      }
    } catch (error) {
      console.error('Error fetching shop details:', error)
      addToast({
        type: 'error',
        message: 'Failed to fetch shop details'
      })
      router.push('/admin/shops')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch(`/api/admin/shops/${shopId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (response.ok) {
        setShop({ ...shop, verificationStatus: newStatus })
        addToast({
          type: 'success',
          message: `Shop status updated to ${newStatus}`
        })
      } else {
        addToast({
          type: 'error',
          message: data.error || 'Failed to update shop status'
        })
      }
    } catch (error) {
      console.error('Error updating shop status:', error)
      addToast({
        type: 'error',
        message: 'Failed to update shop status'
      })
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/shops/${shopId}/products/${productId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setProducts(products.filter(p => p._id !== productId))
        addToast({
          type: 'success',
          message: 'Product deleted successfully'
        })
      } else {
        addToast({
          type: 'error',
          message: data.error || 'Failed to delete product'
        })
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      addToast({
        type: 'error',
        message: 'Failed to delete product'
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 dark:text-green-400'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400'
      case 'rejected': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      case 'rejected': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Shop Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The shop you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/admin/shops"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/shops"
                className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shops
              </Link>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {shop.businessName}
                </h1>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusBadge(shop.verificationStatus)}`}>
                  {shop.verificationStatus}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {shop.verificationStatus === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('verified')}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </button>
              )}
              
              {shop.verificationStatus === 'verified' && (
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shop Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shop Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Shop Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Business Name</p>
                  <p className="text-gray-900 dark:text-white">{shop.businessName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
                  <p className="text-gray-900 dark:text-white">{shop.category}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</p>
                  <div className="flex items-center text-gray-900 dark:text-white">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {shop.location}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verification Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(shop.verificationStatus)}`}>
                    {shop.verificationStatus}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Owner Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-900 dark:text-white">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    {shop.ownerName}
                  </div>
                  <div className="flex items-center text-gray-900 dark:text-white">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {shop.ownerEmail}
                  </div>
                  {shop.ownerPhone && (
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {shop.ownerPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shop Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Shop Statistics
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Products</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{shop.productCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Sales</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{shop.totalSales || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {shop.averageRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Joined</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(shop.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Products ({products.length})
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Shop Products
                  </h3>
                  <Link
                    href={`/admin/shops/${shopId}/products/new`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Product
                  </Link>
                </div>
                
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No products found for this shop
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {products.map((product) => (
                          <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="h-10 w-10 rounded object-cover mr-3"
                                  />
                                ) : (
                                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded mr-3 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              KES {product.price?.toLocaleString()}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.stock > 0
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              }`}>
                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                              </span>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.isActive
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                  : 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
                              }`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/admin/products/${product._id}`}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  title="View Product"
                                >
                                  <Eye size={16} />
                                </Link>
                                
                                <Link
                                  href={`/admin/products/${product._id}/edit`}
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                  title="Edit Product"
                                >
                                  <Edit size={16} />
                                </Link>
                                
                                <button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  title="Delete Product"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Detailed analytics and insights for shop performance will be available soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
