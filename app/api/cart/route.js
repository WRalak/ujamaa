import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
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

// GET user's cart
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

    let cart = await Cart.findOne({ user: decoded.userId })
      .populate('items.product', 'name price images stock isActive')

    if (!cart) {
      // Create empty cart if it doesn't exist
      cart = await Cart.create({
        user: decoded.userId,
        items: [],
        totalAmount: 0,
        totalItems: 0
      })
    }

    return NextResponse.json({ cart })
  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST add item to cart
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

    const { productId, quantity } = await request.json()

    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid product ID and quantity are required' },
        { status: 400 }
      )
    }

    // Check if product exists and is active
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      )
    }

    // Check if enough stock is available
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Not enough stock available' },
        { status: 400 }
      )
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: decoded.userId })
    if (!cart) {
      cart = await Cart.create({
        user: decoded.userId,
        items: [],
        totalAmount: 0,
        totalItems: 0
      })
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    )

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      const newQuantity = cart.items[existingItemIndex].quantity + quantity
      
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { error: 'Not enough stock available' },
          { status: 400 }
        )
      }

      cart.items[existingItemIndex].quantity = newQuantity
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        name: product.name,
        image: product.images[0]?.url || ''
      })
    }

    // Calculate totals
    await cart.calculateTotals()

    // Populate product details for response
    await cart.populate('items.product', 'name price images stock isActive')

    return NextResponse.json({
      message: 'Item added to cart successfully',
      cart
    })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update cart (clear or update multiple items)
export async function PUT(request) {
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

    const { action, items } = await request.json()

    let cart = await Cart.findOne({ user: decoded.userId })
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    if (action === 'clear') {
      cart.items = []
    } else if (action === 'update' && items) {
      // Update multiple items
      for (const item of items) {
        const itemIndex = cart.items.findIndex(
          cartItem => cartItem.product.toString() === item.productId
        )
        
        if (itemIndex !== -1) {
          if (item.quantity <= 0) {
            // Remove item if quantity is 0 or less
            cart.items.splice(itemIndex, 1)
          } else {
            // Update quantity
            const product = await Product.findById(item.productId)
            if (product && product.stock >= item.quantity) {
              cart.items[itemIndex].quantity = item.quantity
            }
          }
        }
      }
    }

    await cart.calculateTotals()
    await cart.populate('items.product', 'name price images stock isActive')

    return NextResponse.json({
      message: 'Cart updated successfully',
      cart
    })
  } catch (error) {
    console.error('Update cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
