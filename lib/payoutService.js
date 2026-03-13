import Payout from '@/models/Payout'
import Order from '@/models/Order'
import SellerProfile from '@/models/SellerProfile'
import UserActivity from '@/models/UserActivity'
import mpesaService from './mpesa'

class PayoutService {
  // Calculate platform fee (e.g., 5% + fixed fee)
  static calculatePlatformFee(amount) {
    const percentageFee = amount * 0.05 // 5%
    const fixedFee = 50 // KES 50 fixed fee
    return percentageFee + fixedFee
  }

  // Generate payout for a seller for a specific period
  static async generatePayout(sellerId, startDate, endDate) {
    try {
      // Get completed orders within the period
      const orders = await Order.find({
        seller: sellerId,
        orderStatus: 'delivered',
        deliveredAt: { $gte: startDate, $lte: endDate },
        payoutProcessed: { $ne: true }
      }).populate('paymentResult')

      if (orders.length === 0) {
        throw new Error('No completed orders found for this period')
      }

      // Calculate amounts
      let totalAmount = 0
      let totalFee = 0
      const orderDetails = []

      for (const order of orders) {
        const orderAmount = order.totalPrice
        const orderFee = this.calculatePlatformFee(orderAmount)
        
        totalAmount += orderAmount
        totalFee += orderFee
        
        orderDetails.push({
          order: order._id,
          amount: orderAmount,
          fee: orderFee,
          date: order.deliveredAt
        })
      }

      const netAmount = totalAmount - totalFee

      // Get seller's payout details
      const sellerProfile = await SellerProfile.findOne({ user: sellerId })
      if (!sellerProfile || !sellerProfile.payoutInfo.isVerified) {
        throw new Error('Seller payout information not verified')
      }

      // Create payout record
      const payout = await Payout.create({
        seller: sellerId,
        totalAmount,
        fee: totalFee,
        netAmount,
        orders: orderDetails,
        payoutMethod: sellerProfile.payoutInfo.method,
        payoutDetails: sellerProfile.payoutInfo.details,
        period: { startDate, endDate }
      })

      // Mark orders as payout processed
      await Order.updateMany(
        { _id: { $in: orders.map(o => o._id) } },
        { payoutProcessed: true }
      )

      // Track activity
      await UserActivity.create({
        user: sellerId,
        action: 'initiate_payout',
        resource: payout._id,
        resourceType: 'Payout',
        metadata: {
          totalAmount,
          netAmount,
          orderCount: orders.length
        }
      })

      return payout
    } catch (error) {
      console.error('Payout generation error:', error)
      throw error
    }
  }

  // Process payout via M-Pesa
  static async processMpesaPayout(payoutId) {
    try {
      const payout = await Payout.findById(payoutId).populate('seller')
      if (!payout || payout.status !== 'pending') {
        throw new Error('Invalid payout or already processed')
      }

      // Update status to processing
      payout.status = 'processing'
      payout.processingDate = new Date()
      await payout.save()

      // Initiate M-Pesa payout (B2C)
      const result = await this.initiateMpesaB2C(
        payout.payoutDetails.phoneNumber,
        payout.netAmount,
        `PAYOUT-${payout._id}`
      )

      if (result.success) {
        payout.providerTransactionId = result.transactionId
        payout.status = 'completed'
        payout.completedDate = new Date()
        payout.transactionId = result.transactionId
        
        await payout.save()

        // Track activity
        await UserActivity.create({
          user: payout.seller._id,
          action: 'complete_payout',
          resource: payout._id,
          resourceType: 'Payout',
          metadata: {
            amount: payout.netAmount,
            transactionId: result.transactionId
          }
        })

        return { success: true, payout }
      } else {
        payout.status = 'failed'
        payout.failureReason = result.error
        await payout.save()

        throw new Error(result.error)
      }
    } catch (error) {
      console.error('M-Pesa payout error:', error)
      throw error
    }
  }

  // Initiate M-Pesa B2C (Business to Customer) payout
  static async initiateMpesaB2C(phoneNumber, amount, remarks) {
    try {
      const token = await mpesaService.getAccessToken()
      
      const payload = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: 'BusinessPayment',
        Amount: Math.round(amount),
        PartyA: process.env.MPESA_SHORTCODE,
        PartyB: mpesaService.formatPhoneNumber(phoneNumber),
        Remarks: remarks,
        QueueTimeOutURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payouts/mpesa/timeout`,
        ResultURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payouts/mpesa/result`,
        Occasion: 'Payout'
      }

      const response = await fetch('https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.ResponseCode === '0') {
        return {
          success: true,
          transactionId: data.ConversationID,
          response: data
        }
      } else {
        return {
          success: false,
          error: data.ResponseDescription || 'M-Pesa B2C request failed',
          response: data
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get seller payout history
  static async getSellerPayouts(sellerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit
  
    const payouts = await Payout.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orders.order')

    const total = await Payout.countDocuments({ seller: sellerId })

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get payout analytics
  static async getPayoutAnalytics(sellerId, startDate, endDate) {
    const matchStage = {
      seller: new mongoose.Types.ObjectId(sellerId),
      createdAt: { $gte: startDate, $lte: endDate }
    }

    const analytics = await Payout.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: '$netAmount' },
          totalFees: { $sum: '$fee' },
          payoutCount: { $sum: 1 },
          averagePayout: { $avg: '$netAmount' },
          completedPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ])

    const monthlyBreakdown = await Payout.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$netAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    return {
      summary: analytics[0] || {
        totalPayouts: 0,
        totalFees: 0,
        payoutCount: 0,
        averagePayout: 0,
        completedPayouts: 0,
        pendingPayouts: 0,
        failedPayouts: 0
      },
      monthlyBreakdown
    }
  }

  // Auto-generate monthly payouts (to be run by cron job)
  static async generateMonthlyPayouts() {
    const sellers = await SellerProfile.find({ 
      isActive: true, 
      isSuspended: false,
      verificationStatus: 'verified'
    })

    const results = []

    for (const seller of sellers) {
      try {
        const endDate = new Date()
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        
        const payout = await this.generatePayout(
          seller.user,
          startDate,
          endDate
        )
        
        results.push({
          seller: seller.user,
          success: true,
          payout: payout._id
        })
      } catch (error) {
        results.push({
          seller: seller.user,
          success: false,
          error: error.message
        })
      }
    }

    return results
  }
}

export default PayoutService
