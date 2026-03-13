import { NextResponse } from 'next/server'
import AnalyticsService from '@/lib/analyticsService'
import { withSecurity, strictRateLimit } from '@/middleware/security'

export async function POST(request) {
  return withSecurity(async (req) => {
    try {
      const { eventType, data } = await request.json()

      if (!eventType) {
        return NextResponse.json(
          { error: 'Event type is required' },
          { status: 400 }
        )
      }

      let result

      switch (eventType) {
        case 'page_view':
          result = await AnalyticsService.trackPageView(data)
          break
        case 'click':
          result = await AnalyticsService.trackAction({
            action: 'click',
            ...data
          })
          break
        case 'form_submit':
        case 'form_start':
          result = await AnalyticsService.trackFormInteraction(eventType, eventType, data)
          break
        case 'search':
          result = await AnalyticsService.trackSearch(data)
          break
        case 'product_view':
        case 'add_to_cart':
        case 'remove_from_cart':
        case 'checkout_start':
        case 'checkout_complete':
        case 'payment_initiate':
        case 'payment_complete':
        case 'payment_failed':
          result = await AnalyticsService.trackEcommerceEvent(eventType, data.ecommerce, data)
          break
        case 'performance':
          result = await AnalyticsService.trackPerformance(data)
          break
        case 'error':
          result = await AnalyticsService.trackError(data)
          break
        default:
          result = await AnalyticsService.trackAction({
            action: eventType,
            ...data
          })
      }

      return NextResponse.json({
        success: true,
        message: 'Event tracked successfully',
        eventId: result._id
      })
    } catch (error) {
      console.error('Track analytics event error:', error)
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      )
    }
  }, { 
    rateLimitType: 'strict' 
  })()
}
