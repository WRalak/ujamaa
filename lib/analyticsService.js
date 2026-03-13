import AnalyticsEvent from '@/models/AnalyticsEvent'
import UserActivity from '@/models/UserActivity'

class AnalyticsService {
  // Track page view
  static async trackPageView(pageData) {
    const eventData = {
      eventType: 'page_view',
      page: {
        url: pageData.url,
        title: pageData.title,
        path: pageData.path,
        referrer: pageData.referrer
      },
      device: pageData.device,
      location: pageData.location,
      performance: pageData.performance,
      userId: pageData.userId,
      sessionId: pageData.sessionId,
      session: pageData.session
    }

    return await AnalyticsEvent.trackEvent(eventData)
  }

  // Track user action
  static async trackAction(actionData) {
    const eventData = {
      eventType: actionData.action,
      properties: actionData.properties || {},
      page: actionData.page,
      device: actionData.device,
      userId: actionData.userId,
      sessionId: actionData.sessionId,
      ecommerce: actionData.ecommerce
    }

    return await AnalyticsEvent.trackEvent(eventData)
  }

  // Track e-commerce event
  static async trackEcommerceEvent(eventType, ecommerceData, additionalData = {}) {
    const eventData = {
      eventType,
      ecommerce: ecommerceData,
      properties: additionalData.properties || {},
      userId: additionalData.userId,
      sessionId: additionalData.sessionId,
      page: additionalData.page
    }

    return await AnalyticsEvent.trackEvent(eventData)
  }

  // Track form interaction
  static async trackFormInteraction(formType, status, formData, additionalData = {}) {
    const eventType = status === 'submit' ? 'form_submit' : 'form_start'
    
    const eventData = {
      eventType,
      properties: {
        formType,
        formId: formData.formId,
        ...formData
      },
      page: additionalData.page,
      userId: additionalData.userId,
      sessionId: additionalData.sessionId
    }

    return await AnalyticsEvent.trackEvent(eventData)
  }

  // Track search
  static async trackSearch(searchData, additionalData = {}) {
    const eventData = {
      eventType: 'search',
      properties: {
        query: searchData.query,
        category: searchData.category,
        filters: searchData.filters,
        resultsCount: searchData.resultsCount
      },
      page: additionalData.page,
      userId: additionalData.userId,
      sessionId: additionalData.sessionId
    }

    return await AnalyticsEvent.trackEvent(eventData)
  }

  // Track performance
  static async trackPerformance(performanceData, additionalData = {}) {
    const eventData = {
      eventType: 'performance',
      performance: performanceData,
      page: additionalData.page,
      userId: additionalData.userId,
      sessionId: additionalData.sessionId
    }

    return await AnalyticsEvent.trackEvent(eventData)
  }

  // Track error
  static async trackError(errorData, additionalData = {}) {
    const eventData = {
      eventType: 'error',
      properties: {
        error: errorData.error,
        stack: errorData.stack,
        url: errorData.url,
        line: errorData.line,
        column: errorData.column
      },
      page: additionalData.page,
      userId: additionalData.userId,
      sessionId: additionalData.sessionId
    }

    return await AnalyticsEvent.trackEvent(eventData)
  }

  // Get dashboard analytics
  static async getDashboardAnalytics(timeRange = '30d', filters = {}) {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    const [
      overview,
      topPages,
      conversionFunnel,
      realTimeMetrics
    ] = await Promise.all([
      this.getOverviewMetrics(startDate, endDate),
      this.getTopPages(startDate, endDate),
      AnalyticsEvent.getConversionFunnel(startDate, endDate),
      AnalyticsEvent.getRealTimeMetrics()
    ])

    return {
      overview,
      topPages,
      conversionFunnel,
      realTimeMetrics,
      timeRange
    }
  }

  // Get overview metrics
  static async getOverviewMetrics(startDate, endDate) {
    const [
      pageViews,
      uniqueUsers,
      sessions,
      conversions,
      revenue
    ] = await Promise.all([
      AnalyticsEvent.getEventMetrics('page_view', startDate, endDate),
      AnalyticsEvent.getEventMetrics('page_view', startDate, endDate).then(m => m.uniqueUserCount),
      AnalyticsEvent.getEventMetrics('page_view', startDate, endDate).then(m => m.uniqueSessionCount),
      AnalyticsEvent.getEventMetrics('checkout_complete', startDate, endDate),
      AnalyticsEvent.getEventMetrics('payment_complete', startDate, endDate)
    ])

    return {
      pageViews: pageViews.totalEvents,
      uniqueUsers,
      sessions,
      conversions: conversions.totalEvents,
      revenue: revenue.totalValue,
      conversionRate: uniqueUsers > 0 ? (conversions.totalEvents / uniqueUsers) * 100 : 0,
      avgSessionDuration: sessions > 0 ? 60000 : 0 // Placeholder
    }
  }

  // Get top pages
  static async getTopPages(startDate, endDate, limit = 10) {
    return await AnalyticsEvent.getPageMetrics(startDate, endDate, limit)
  }

  // Get user behavior analysis
  static async getUserAnalytics(userId, timeRange = '30d') {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    const [analyticsData, userActivity] = await Promise.all([
      AnalyticsEvent.getUserBehaviorAnalysis(userId, startDate, endDate),
      UserActivity.getUserActivitySummary(userId, startDate, endDate)
    ])

    return {
      analytics: analyticsData,
      activity: userActivity,
      timeRange
    }
  }

  // Get product analytics
  static async getProductAnalytics(productId, timeRange = '30d') {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    const [
      views,
      addToCarts,
      purchases,
      reviews
    ] = await Promise.all([
      AnalyticsEvent.getEventMetrics('product_view', startDate, endDate),
      AnalyticsEvent.getEventMetrics('add_to_cart', startDate, endDate),
      AnalyticsEvent.getEventMetrics('checkout_complete', startDate, endDate),
      AnalyticsEvent.getEventMetrics('review_submit', startDate, endDate)
    ])

    return {
      views: views.totalEvents,
      addToCarts: addToCarts.totalEvents,
      purchases: purchases.totalEvents,
      reviews: reviews.totalEvents,
      conversionRate: views.totalEvents > 0 ? (purchases.totalEvents / views.totalEvents) * 100 : 0,
      cartConversionRate: views.totalEvents > 0 ? (addToCarts.totalEvents / views.totalEvents) * 100 : 0
    }
  }

  // Get real-time metrics
  static async getRealTimeMetrics(minutes = 5) {
    return await AnalyticsEvent.getRealTimeMetrics(minutes)
  }

  // Get traffic sources
  static async getTrafficSources(startDate, endDate) {
    const trafficData = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'page_view',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$page.referrer',
          visits: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { visits: -1 } },
      { $limit: 10 }
    ])

    return trafficData.map(source => ({
      source: source._id || 'Direct',
      visits: source.visits,
      uniqueUsers: source.uniqueUserCount
    }))
  }

  // Get device analytics
  static async getDeviceAnalytics(startDate, endDate) {
    const deviceData = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'page_view',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$device.type',
          visits: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          avgLoadTime: { $avg: '$performance.loadTime' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { visits: -1 } }
    ])

    return deviceData
  }

  // Get geographic analytics
  static async getGeographicAnalytics(startDate, endDate) {
    const geoData = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'page_view',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$location.country',
          visits: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { visits: -1 } }
    ])

    return geoData
  }

  // Export data
  static async exportData(startDate, endDate, format = 'json') {
    const events = await AnalyticsEvent.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 })

    switch (format) {
      case 'json':
        return events
      case 'csv':
        return this.convertToCSV(events)
      default:
        return events
    }
  }

  static convertToCSV(events) {
    const headers = [
      'timestamp', 'eventType', 'userId', 'sessionId', 'pageUrl', 'pageTitle',
      'deviceType', 'os', 'browser', 'country', 'city'
    ]

    const csvContent = [
      headers.join(','),
      ...events.map(event => [
        event.timestamp.toISOString(),
        event.eventType,
        event.userId || '',
        event.sessionId || '',
        event.page?.url || '',
        event.page?.title || '',
        event.device?.type || '',
        event.device?.os || '',
        event.device?.browser || '',
        event.location?.country || '',
        event.location?.city || ''
      ].join(','))
    ].join('\n')

    return csvContent
  }

  // Clean up old data
  static async cleanup() {
    return await AnalyticsEvent.cleanupOldEvents()
  }

  // Generate custom report
  static async generateCustomReport(config) {
    const {
      name,
      description,
      eventTypes,
      startDate,
      endDate,
      groupBy,
      filters
    } = config

    const matchStage = {
      timestamp: { $gte: startDate, $lte: endDate }
    }

    if (eventTypes && eventTypes.length > 0) {
      matchStage.eventType = { $in: eventTypes }
    }

    if (filters) {
      Object.assign(matchStage, filters)
    }

    const groupField = groupBy || 'eventType'

    const reportData = await AnalyticsEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: `$${groupField}`,
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } }
    ])

    return {
      name,
      description,
      generatedAt: new Date(),
      dateRange: { startDate, endDate },
      data: reportData
    }
  }
}

export default AnalyticsService
