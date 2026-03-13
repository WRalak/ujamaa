import mongoose from 'mongoose'

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Product actions
      'view_product', 'search_product', 'add_to_cart', 'remove_from_cart', 'checkout',
      'add_to_wishlist', 'remove_from_wishlist', 'write_review', 'report_product',
      
      // Order actions
      'create_order', 'cancel_order', 'return_order', 'track_order',
      
      // Payment actions
      'initiate_payment', 'complete_payment', 'payment_failed', 'refund_requested',
      
      // Account actions
      'login', 'logout', 'register', 'update_profile', 'change_password',
      'add_address', 'update_address', 'delete_address',
      
      // Seller actions
      'add_product', 'update_product', 'delete_product', 'update_stock',
      'process_order', 'ship_order', 'mark_delivered',
      
      // System actions
      'view_page', 'click_link', 'download_file', 'share_content',
      'submit_feedback', 'report_issue', 'contact_support'
    ]
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceType'
  },
  resourceType: {
    type: String,
    enum: ['Product', 'Order', 'Payment', 'User', 'Review', 'Category']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  geolocation: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  deviceInfo: {
    type: String,
    mobile: Boolean,
    browser: String,
    os: String
  }
}, {
  timestamps: true
})

// Compound indexes for efficient querying
userActivitySchema.index({ user: 1, timestamp: -1 })
userActivitySchema.index({ action: 1, timestamp: -1 })
userActivitySchema.index({ resource: 1, resourceType: 1, timestamp: -1 })
userActivitySchema.index({ timestamp: -1 })

// Static methods for analytics
userActivitySchema.statics.getUserActivitySummary = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ])
}

userActivitySchema.statics.getActionAnalytics = async function(action, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        action,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        successRate: {
          $avg: { $cond: ['$success', 1, 0] }
        },
        avgDuration: { $avg: '$duration' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $project: {
        uniqueUsers: 0
      }
    }
  ])
}

userActivitySchema.statics.getPopularProducts = async function(limit = 10, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        action: 'view_product',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$resource',
        viewCount: { $sum: 1 },
        uniqueViewers: { $addToSet: '$user' }
      }
    },
    {
      $addFields: {
        uniqueViewerCount: { $size: '$uniqueViewers' }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        product: 1,
        viewCount: 1,
        uniqueViewerCount: 1
      }
    },
    { $sort: { viewCount: -1 } },
    { $limit: limit }
  ])
}

const UserActivity = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema)

export default UserActivity
