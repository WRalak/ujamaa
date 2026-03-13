import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      // Page views
      'page_view',
      'page_exit',
      'page_scroll',
      
      // User actions
      'click',
      'form_submit',
      'form_start',
      'search',
      'filter',
      'sort',
      
      // E-commerce events
      'product_view',
      'add_to_cart',
      'remove_from_cart',
      'checkout_start',
      'checkout_complete',
      'payment_initiate',
      'payment_complete',
      'payment_failed',
      
      // User engagement
      'login',
      'logout',
      'register',
      'profile_update',
      'review_submit',
      'wishlist_add',
      'share',
      
      // Content engagement
      'image_view',
      'video_play',
      'download',
      'copy_code',
      
      // System events
      'error',
      'api_call',
      'performance',
      'security_event'
    ]
  },
  
  // Event properties
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  
  // Page information
  page: {
    url: String,
    title: String,
    path: String,
    referrer: String
  },
  
  // Device and browser information
  device: {
    type: String,
    os: String,
    browser: String,
    screenResolution: String,
    viewportSize: String,
    isMobile: Boolean,
    isTablet: Boolean,
    isDesktop: Boolean
  },
  
  // Geographic information
  location: {
    country: String,
    city: String,
    region: String,
    latitude: Number,
    longitude: Number
  },
  
  // Performance metrics
  performance: {
    loadTime: Number, // Page load time in ms
    firstContentfulPaint: Number,
    largestContentfulPaint: Number,
    cumulativeLayoutShift: Number,
    firstInputDelay: Number
  },
  
  // E-commerce specific
  ecommerce: {
    currency: String,
    value: Number,
    items: [{
      itemId: String,
      itemName: String,
      itemCategory: String,
      itemPrice: Number,
      quantity: Number
    }],
    transactionId: String,
    paymentMethod: String
  },
  
  // Custom dimensions
  customDimensions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Session information
  session: {
    startTime: Date,
    duration: Number, // Session duration in seconds
    pageViews: Number,
    bounceRate: Boolean,
    entryPage: String,
    exitPage: String
  }
}, {
  timestamps: true
})

// Indexes for efficient querying
analyticsEventSchema.index({ eventType: 1, timestamp: -1 })
analyticsEventSchema.index({ userId: 1, timestamp: -1 })
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 })
analyticsEventSchema.index({ 'page.path': 1, timestamp: -1 })
analyticsEventSchema.index({ timestamp: -1 })

// Static methods for analytics
analyticsEventSchema.statics.trackEvent = async function(eventData) {
  const event = await this.create({
    ...eventData,
    timestamp: new Date()
  })
  
  // Emit real-time event for dashboard
  if (global.io) {
    global.io.emit('analytics_event', event)
  }
  
  return event
}

analyticsEventSchema.statics.getEventMetrics = async function(eventType, startDate, endDate) {
  const matchStage = {
    eventType,
    timestamp: { $gte: startDate, $lte: endDate }
  }

  const metrics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' },
        avgValue: { $avg: '$ecommerce.value' },
        totalValue: { $sum: '$ecommerce.value' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueSessionCount: { $size: '$uniqueSessions' }
      }
    },
    {
      $project: {
        uniqueUsers: 0,
        uniqueSessions: 0
      }
    }
  ])

  return metrics[0] || {
    totalEvents: 0,
    uniqueUserCount: 0,
    uniqueSessionCount: 0,
    avgValue: 0,
    totalValue: 0
  }
}

analyticsEventSchema.statics.getPageMetrics = async function(startDate, endDate, limit = 10) {
  const pageViews = await this.aggregate([
    {
      $match: {
        eventType: 'page_view',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$page.path',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' },
        avgLoadTime: { $avg: '$performance.loadTime' },
        avgSessionDuration: { $avg: '$session.duration' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueSessionCount: { $size: '$uniqueSessions' }
      }
    },
    { $sort: { views: -1 } },
    { $limit: limit }
  ])

  return pageViews
}

analyticsEventSchema.statics.getUserBehaviorAnalysis = async function(userId, startDate, endDate) {
  const userEvents = await this.find({
    userId,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: 1 })

  const analysis = {
    totalEvents: userEvents.length,
    eventTypes: {},
    pagesVisited: new Set(),
    sessionDuration: 0,
    conversionEvents: [],
    performanceMetrics: {
      avgLoadTime: 0,
      avgFCP: 0,
      avgLCP: 0
    }
  }

  userEvents.forEach(event => {
    // Count event types
    analysis.eventTypes[event.eventType] = (analysis.eventTypes[event.eventType] || 0) + 1
    
    // Track pages visited
    if (event.page && event.page.path) {
      analysis.pagesVisited.add(event.page.path)
    }
    
    // Track conversion events
    if (['checkout_complete', 'payment_complete', 'register'].includes(event.eventType)) {
      analysis.conversionEvents.push(event)
    }
    
    // Track performance metrics
    if (event.performance) {
      if (event.performance.loadTime) analysis.performanceMetrics.avgLoadTime += event.performance.loadTime
      if (event.performance.firstContentfulPaint) analysis.performanceMetrics.avgFCP += event.performance.firstContentfulPaint
      if (event.performance.largestContentfulPaint) analysis.performanceMetrics.avgLCP += event.performance.largestContentfulPaint
    }
  })

  // Calculate averages
  const perfMetrics = analysis.performanceMetrics
  const eventCount = userEvents.filter(e => e.performance).length
  if (eventCount > 0) {
    perfMetrics.avgLoadTime /= eventCount
    perfMetrics.avgFCP /= eventCount
    perfMetrics.avgLCP /= eventCount
  }

  analysis.pagesVisited = Array.from(analysis.pagesVisited)

  return analysis
}

analyticsEventSchema.statics.getConversionFunnel = async function(startDate, endDate) {
  const funnelSteps = [
    'product_view',
    'add_to_cart',
    'checkout_start',
    'checkout_complete'
  ]

  const funnelData = []

  for (const step of funnelSteps) {
    const metrics = await this.getEventMetrics(step, startDate, endDate)
    funnelData.push({
      step,
      ...metrics,
      conversionRate: 0 // Will be calculated below
    })
  }

  // Calculate conversion rates
  const firstStepUsers = funnelData[0]?.uniqueUserCount || 1
  funnelData.forEach((step, index) => {
      if (index === 0) {
        step.conversionRate = 100
      } else {
        step.conversionRate = (step.uniqueUserCount / firstStepUsers) * 100
      }
  })

  return funnelData
}

analyticsEventSchema.statics.getRealTimeMetrics = async function(minutes = 5) {
  const since = new Date(Date.now() - minutes * 60 * 1000)
  
  const metrics = await this.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: null,
        activeUsers: { $addToSet: '$userId' },
        pageViews: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
        conversions: { $sum: { $cond: [{ $in: ['$eventType', ['checkout_complete', 'payment_complete', 'register']] }, 1, 0] } }
      }
    },
    {
      $addFields: {
        activeUserCount: { $size: '$activeUsers' }
      }
    },
    {
      $project: {
        activeUsers: 0
      }
    }
  ])

  return metrics[0] || {
    activeUserCount: 0,
    pageViews: 0,
    clicks: 0,
    conversions: 0
  }
}

// Clean up old events (older than 1 year)
analyticsEventSchema.statics.cleanupOldEvents = async function() {
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  
  const result = await this.deleteMany({
    timestamp: { $lt: oneYearAgo }
  })

  console.log(`Cleaned up ${result.deletedCount} old analytics events`)
  return result.deletedCount
}

const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema)

export default AnalyticsEvent
