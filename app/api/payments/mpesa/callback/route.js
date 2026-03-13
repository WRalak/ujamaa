import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Order from '@/models/Order'

export async function POST(request) {
  try {
    await connectDB()

    const callbackData = await request.json()
    console.log('M-Pesa Callback received:', callbackData)

    // Extract relevant data from callback
    const { Body } = callbackData
    const { stkCallback } = Body
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback

    // Find the payment record
    const payment = await Payment.findOne({ checkoutRequestID: CheckoutRequestID })
    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID)
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Payment not found' })
    }

    // Update payment status based on result
    if (ResultCode === 0) {
      // Payment successful
      payment.status = 'completed'
      payment.processedAt = new Date()
      payment.mpesaResponse = callbackData

      // Extract metadata if available
      if (CallbackMetadata && CallbackMetadata.Item) {
        const metadata = {}
        CallbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value
        })
        
        if (metadata.MpesaReceiptNumber) {
          payment.providerTransactionId = metadata.MpesaReceiptNumber
        }
        if (metadata.PhoneNumber) {
          payment.phoneNumber = metadata.PhoneNumber
        }
        if (metadata.Amount) {
          payment.amount = metadata.Amount
        }
      }

      // Update order status
      await Order.findByIdAndUpdate(payment.order, {
        paymentResult: {
          id: payment.providerTransactionId,
          status: 'completed',
          update_time: new Date().toISOString(),
          email_address: ''
        },
        orderStatus: 'processing'
      })

      console.log('Payment completed successfully:', payment.transactionId)
    } else {
      // Payment failed
      payment.status = 'failed'
      payment.failureReason = ResultDesc
      payment.mpesaResponse = callbackData

      // Update order status
      await Order.findByIdAndUpdate(payment.order, {
        orderStatus: 'cancelled'
      })

      console.log('Payment failed:', payment.transactionId, ResultDesc)
    }

    await payment.save()

    // Return success response to M-Pesa
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal server error' })
  }
}
