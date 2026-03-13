import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// GET user's orders
export async function GET(request) {
  try {
    await connectDB()

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status')

    // Build query
    let query = { user: decoded.userId }
    if (status) {
      query.orderStatus = status
    }

    // Get orders with pagination
    const skip = (page - 1) * limit
    const orders = await Order.find(query)
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Order.countDocuments(query)

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new order
export async function POST(request) {
  try {
    await connectDB()

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const {
      shippingAddress,
      paymentMethod,
      orderItems
    } = await request.json()

    // Validate required fields
    if (!shippingAddress || !paymentMethod || !orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      )
    }

    // Validate shipping address
    const requiredAddressFields = ['street', 'city', 'state', 'zipCode', 'country']
    const missingAddressFields = requiredAddressFields.filter(
      field => !shippingAddress[field]
    )
    
    if (missingAddressFields.length > 0) {
      return NextResponse.json(
        { error: `Missing address fields: ${missingAddressFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Check stock availability and get current prices
    let itemsPrice = 0
    const validatedOrderItems = []

    for (const item of orderItems) {
      const product = await Product.findById(item.productId)
      
      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or not available` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for product: ${product.name}` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      itemsPrice += itemTotal

      validatedOrderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
        image: product.images[0]?.url || ''
      })

      // Update product stock
      product.stock -= item.quantity
      await product.save()
    }

    // Calculate additional costs
    const taxPrice = itemsPrice * 0.08 // 8% tax
    const shippingPrice = itemsPrice > 100 ? 0 : 10 // Free shipping over $100
    const totalPrice = itemsPrice + taxPrice + shippingPrice

    // Create order
    const order = await Order.create({
      user: decoded.userId,
      orderItems: validatedOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderStatus: 'pending'
    })

    // Clear user's cart
    const cart = await Cart.findOne({ user: decoded.userId })
    if (cart) {
      cart.items = []
      await cart.calculateTotals()
    }

    // Populate product details for response
    await order.populate('orderItems.product', 'name images')

    return NextResponse.json({
      message: 'Order created successfully',
      order
    }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
