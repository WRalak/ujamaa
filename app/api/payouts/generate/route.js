import { NextResponse } from 'next/server'
import PayoutService from '@/lib/payoutService'
import { withAuth, sellerOrAdmin } from '@/middleware/auth'

export async function POST(request) {
  return withAuth(async (req) => {
    try {
      const { startDate, endDate } = await request.json()

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'Start date and end date are required' },
          { status: 400 }
        )
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start >= end) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        )
      }

      const payout = await PayoutService.generatePayout(
        req.user._id,
        start,
        end
      )

      return NextResponse.json({
        message: 'Payout generated successfully',
        payout
      })
    } catch (error) {
      console.error('Generate payout error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to generate payout' },
        { status: 500 }
      )
    }
  }, ['seller', 'admin'])()
}
