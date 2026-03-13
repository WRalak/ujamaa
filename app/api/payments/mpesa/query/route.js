import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
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

    const { checkoutRequestID } = await request.json()

    if (!checkoutRequestID) {
      return NextResponse.json(
        { error: 'CheckoutRequestID is required' },
        { status: 400 }
      )
    }

    // Find the payment record
    const payment = await Payment.findOne({ checkoutRequestID })
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if user owns this payment
    if (payment.user.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Not authorized to query this payment' },
        { status: 403 }
      )
    }

    // Query M-Pesa transaction status
    const queryResponse = await mpesaService.queryTransactionStatus(checkoutRequestID)

    if (!queryResponse.success) {
      return NextResponse.json(
        { error: queryResponse.error || 'Failed to query payment status' },
        { status: 400 }
      )
    }

    // Update payment status based on M-Pesa response
    const { ResultCode, ResultDesc, CallbackMetadata } = queryResponse.data.stkCallback

    if (ResultCode === 0) {
      payment.status = 'completed'
      payment.processedAt = new Date()
      
      // Extract metadata if available
      if (CallbackMetadata && CallbackMetadata.Item) {
        const metadata = {}
        CallbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value
        })
        
        if (metadata.MpesaReceiptNumber) {
          payment.providerTransactionId = metadata.MpesaReceiptNumber
        }
      }
    } else if (ResultCode && ResultCode !== 0) {
      payment.status = 'failed'
      payment.failureReason = ResultDesc
    }

    payment.mpesaResponse = queryResponse.data
    await payment.save()

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        providerTransactionId: payment.providerTransactionId,
        failureReason: payment.failureReason,
        processedAt: payment.processedAt
      },
      mpesaResponse: queryResponse.data
    })
  } catch (error) {
    console.error('Payment query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
