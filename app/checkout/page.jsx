'use client'
import { useState, useEffect } from 'react'
import { ShoppingCart, CreditCard, Smartphone, Truck, Shield, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ShippingService from '@/lib/shipping'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Confirmation
  const [formData, setFormData] = useState({
    // Shipping info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'KE',
    region: '',
    city: '',
    street: '',
    zipCode: '',
    
    // Payment info
    paymentMethod: 'mpesa',
    mpesaPhone: '',
    
    // Order notes
    orderNotes: ''
  })
  
  const [orderTotals, setOrderTotals] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)

  const countries = ShippingService.getSupportedCountries()
  const kenyaCounties = ShippingService.getKenyaCounties()

  useEffect(() => {
    fetchCart()
  }, [])

  useEffect(() => {
    if (cart && formData.country && formData.region && formData.city) {
      const totals = ShippingService.calculateOrderTotals(
        cart.totalAmount,
        formData.country,
        formData.region,
        formData.city
      )
      setOrderTotals(totals)
    }
  }, [cart, formData.country, formData.region, formData.city])

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCart(data.cart)
      } else {
        console.error('Failed to fetch cart')
        router.push('/cart')
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      router.push('/cart')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateStep1 = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'country', 'region', 'city', 'street']
    const missing = required.filter(field => !formData[field])
    
    if (missing.length > 0) {
      alert(`Please fill in all required fields: ${missing.join(', ')}`)
      return false
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address')
      return false
    }

    // Validate phone (basic validation for East African numbers)
    const phoneRegex = /^(\+254|0)?[17]\d{8}$/
    if (formData.country === 'KE' && !phoneRegex.test(formData.phone)) {
      alert('Please enter a valid Kenyan phone number')
      return false
    }

    return true
  }

  const validateStep2 = () => {
    if (formData.paymentMethod === 'mpesa') {
      const phoneRegex = /^(\+254|0)?[17]\d{8}$/
      if (!phoneRegex.test(formData.mpesaPhone)) {
        alert('Please enter a valid M-Pesa phone number')
        return false
      }
    }

    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      handlePayment()
    }
  }

  const handlePayment = async () => {
    setProcessingPayment(true)
    
    try {
      const token = localStorage.getItem('token')
      
      // First create the order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.region,
            zipCode: formData.zipCode,
            country: ShippingService.getCountryInfo(formData.country)?.name || formData.country
          },
          paymentMethod: formData.paymentMethod,
          orderItems: cart.items.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
          }))
        })
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const orderData = await orderResponse.json()
      const order = orderData.order

      // Initiate payment
      if (formData.paymentMethod === 'mpesa') {
        const paymentResponse = await fetch('/api/payments/mpesa/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: order._id,
            phoneNumber: formData.mpesaPhone,
            method: 'mpesa'
          })
        })

        if (!paymentResponse.ok) {
          const error = await paymentResponse.json()
          throw new Error(error.error || 'Failed to initiate payment')
        }

        const paymentData = await paymentResponse.json()
        
        setPaymentStatus({
          success: true,
          message: 'M-Pesa payment initiated! Please check your phone to complete the payment.',
          checkoutRequestID: paymentData.payment.checkoutRequestID,
          orderId: order._id
        })

        // Start polling for payment status
        pollPaymentStatus(paymentData.payment.checkoutRequestID, order._id)
      }

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus({
        success: false,
        message: error.message || 'Payment failed. Please try again.'
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const pollPaymentStatus = async (checkoutRequestID, orderId) => {
    const maxAttempts = 20
    let attempts = 0

    const poll = async () => {
      attempts++
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/payments/mpesa/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ checkoutRequestID })
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.payment.status === 'completed') {
            setPaymentStatus({
              success: true,
              message: 'Payment completed successfully! Your order has been confirmed.',
              completed: true,
              orderId
            })
            setStep(3)
            return
          } else if (data.payment.status === 'failed') {
            setPaymentStatus({
              success: false,
              message: 'Payment failed. Please try again or contact support.',
              failed: true
            })
            return
          }
        }

        // Continue polling if not completed or failed
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          setPaymentStatus({
            success: false,
            message: 'Payment verification timed out. Please check your order status later.',
            timeout: true
          })
        }
      } catch (error) {
        console.error('Payment status check error:', error)
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        }
      }
    }

    // Start polling after a short delay
    setTimeout(poll, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Continue Shopping
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {step > 1 ? <Check size={20} /> : 1}
            </div>
            <span className="ml-2 font-medium">Shipping</span>
          </div>
          
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {step > 2 ? <Check size={20} /> : 2}
          </div>
          <span className="ml-2 font-medium">Payment</span>
          
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {step > 3 ? <Check size={20} /> : 3}
          </div>
          <span className="ml-2 font-medium">Confirmation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+254712345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      required
                    >
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.country === 'KE' ? 'County/Region *' : 'Region *'}
                    </label>
                    {formData.country === 'KE' ? (
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                        required
                      >
                        <option value="">Select County</option>
                        {kenyaCounties.map(county => (
                          <option key={county} value={county}>{county}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                        required
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City/Town *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                    <textarea
                      name="orderNotes"
                      value={formData.orderNotes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                      placeholder="Special instructions for delivery..."
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-lg p-4 hover:border-green-600 cursor-pointer">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={formData.paymentMethod === 'mpesa'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <Smartphone className="mr-2 text-green-600" size={24} />
                        <div>
                          <p className="font-medium">M-Pesa</p>
                          <p className="text-sm text-gray-500">Pay with M-Pesa mobile money</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {formData.paymentMethod === 'mpesa' && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        M-Pesa Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="mpesaPhone"
                        value={formData.mpesaPhone}
                        onChange={handleInputChange}
                        placeholder="+254712345678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Enter the phone number registered with M-Pesa
                      </p>
                    </div>
                  )}

                  <div className="border border-gray-300 rounded-lg p-4 opacity-50 cursor-not-allowed">
                    <label className="flex items-center cursor-not-allowed">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="airtel_money"
                        disabled
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <Smartphone className="mr-2 text-blue-600" size={24} />
                        <div>
                          <p className="font-medium">Airtel Money</p>
                          <p className="text-sm text-gray-500">Coming soon</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="border border-gray-300 rounded-lg p-4 opacity-50 cursor-not-allowed">
                    <label className="flex items-center cursor-not-allowed">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        disabled
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <Truck className="mr-2 text-orange-600" size={24} />
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-gray-500">Coming soon</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentStatus && !paymentStatus.completed && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    paymentStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="font-medium">{paymentStatus.message}</p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="text-green-600" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for your order. You will receive a confirmation email shortly.
                  </p>
                  <div className="space-y-4">
                    <Link
                      href="/orders"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      View My Orders
                      <ArrowRight className="ml-2" size={20} />
                    </Link>
                    <br />
                    <Link
                      href="/shop"
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {ShippingService.formatCurrency(cart.totalAmount, 'KES')}
                  </span>
                </div>
                
                {orderTotals && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">
                        {orderTotals.shipping.isFree ? 'FREE' : ShippingService.formatCurrency(orderTotals.shipping.cost, 'KES')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({orderTotals.tax.percentage}%)</span>
                      <span className="text-gray-900">
                        {ShippingService.formatCurrency(orderTotals.tax.amount, 'KES')}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base font-semibold text-gray-900">
                      {orderTotals ? ShippingService.formatCurrency(orderTotals.total, 'KES') : 'Calculating...'}
                    </span>
                  </div>
                </div>
              </div>

              {orderTotals && orderTotals.shipping.amountNeededForFree > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-green-800">
                    Add {ShippingService.formatCurrency(orderTotals.shipping.amountNeededForFree, 'KES')} more for FREE shipping!
                  </p>
                </div>
              )}

              {orderTotals && (
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Truck className="mr-2" size={16} />
                    <span>Estimated delivery: {orderTotals.shipping.estimatedDays} days</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="mr-2" size={16} />
                    <span>Secure payment with M-Pesa</span>
                  </div>
                </div>
              )}

              {step < 3 && (
                <button
                  onClick={handleNextStep}
                  disabled={processingPayment || (step === 2 && !orderTotals)}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : step === 1 ? (
                    'Continue to Payment'
                  ) : (
                    'Complete Payment'
                  )}
                </button>
              )}

              {step === 1 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/cart"
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Back to Cart
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
