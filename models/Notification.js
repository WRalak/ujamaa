import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'info', 'success', 'warning', 'error',
      'order', 'payment', 'shipping', 'review',
      'promotion', 'system', 'security'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  actionUrl: {
    type: String
  },
  actionText: {
    type: String,
    default: 'View'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
})

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 })
notificationSchema.index({ type: 1, createdAt: -1 })
notificationSchema.index({ priority: 1, read: 1, createdAt: -1 })

// Static methods
notificationSchema.statics.createNotification = async function(userId, notificationData) {
  const notification = await this.create({
    user: userId,
    ...notificationData
  })

  // Emit socket event for real-time notification
  // This would integrate with Socket.IO
  if (global.io) {
    global.io.to(userId).emit('newNotification', notification)
  }

  return notification
}

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true, readAt: new Date() },
    { new: true }
  )
}

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() }
  )
}

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    user: userId,
    read: false,
    expiresAt: { $gt: new Date() }
  })
}

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options

  const query = {
    user: userId,
    expiresAt: { $gt: new Date() }
  }

  if (unreadOnly) {
    query.read = false
  }

  if (type) {
    query.type = type
  }

  const skip = (page - 1) * limit

  const notifications = await this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await this.countDocuments(query)

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

notificationSchema.statics.deleteExpiredNotifications = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lte: new Date() }
  })

  return result.deletedCount
}

notificationSchema.statics.createBulkNotifications = async function(notifications) {
  const createdNotifications = await this.insertMany(notifications)

  // Emit socket events for real-time notifications
  if (global.io) {
    createdNotifications.forEach(notification => {
      global.io.to(notification.user.toString()).emit('newNotification', notification)
    })
  }

  return createdNotifications
}

// Instance method
notificationSchema.methods.markAsRead = function() {
  this.read = true
  this.readAt = new Date()
  return this.save()
}

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)

export default Notification
