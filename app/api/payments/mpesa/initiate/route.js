import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Order from '@/models/Order'
import mpesaService from '@/lib/mpesa'
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

    const { orderId, phoneNumber, method } = await request.json()

    // Validate input
    if (!orderId || !phoneNumber || !method) {
      return NextResponse.json(
        { error: 'Order ID, phone number, and payment method are required' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user owns this order
    if (order.user.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Not authorized to pay for this order' },
        { status: 403 }
      )
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ order: orderId })
    if (existingPayment && existingPayment.status === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed for this order' },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await Payment.create({
      order: orderId,
      user: decoded.userId,
      method,
      amount: order.totalPrice,
      currency: 'KES',
      phoneNumber: mpesaService.formatPhoneNumber(phoneNumber),
      status: 'pending'
    })

    // Initiate M-Pesa payment
    if (method === 'mpesa') {
      const stkResponse = await mpesaService.initiateSTKPush(
        mpesaService.formatPhoneNumber(phoneNumber),
        order.totalPrice,
        `ORDER-${orderId}`,
        `Payment for order ${orderId}`
      )

      if (!stkResponse.success) {
        payment.status = 'failed'
        payment.failureReason = stkResponse.error
        await payment.save()

        return NextResponse.json(
          { error: stkResponse.error || 'Failed to initiate M-Pesa payment' },
          { status: 400 }
        )
      }

      // Update payment with M-Pesa details
      payment.checkoutRequestID = stkResponse.data.CheckoutRequestID
      payment.merchantRequestID = stkResponse.data.MerchantRequestID
      payment.mpesaResponse = stkResponse.data
      await payment.save()

      return NextResponse.json({
        success: true,
        message: 'M-Pesa payment initiated successfully',
        payment: {
          id: payment._id,
          transactionId: payment.transactionId,
          checkoutRequestID: payment.checkoutRequestID,
          amount: payment.amount,
          currency: payment.currency
        },
        mpesaResponse: stkResponse.data
      })
    }

    // Handle other payment methods (placeholder for future implementation)
    return NextResponse.json(
      { error: 'Payment method not yet supported' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
