const mongoose = require('mongoose')

const queueSchema = new mongoose.Schema({
  // Queue type: 'shop_verification', 'product_review', 'support_ticket', etc.
  type: {
    type: String,
    required: true,
    enum: ['shop_verification', 'product_review', 'support_ticket', 'payout_processing', 'user_report', 'content_moderation']
  },
  
  // Priority levels
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Reference to the related item
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'type'
  },
  
  // Queue status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Who submitted to queue
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  
  // Who is currently processing
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Queue metadata
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Processing notes
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Estimated processing time
  estimatedProcessingTime: {
    type: Number, // in minutes
    default: 30
  },
  
  // Actual processing time
  actualProcessingTime: {
    type: Number // in minutes
  },
  
  // Queue position (calculated)
  position: {
    type: Number,
    default: 0
  },
  
  // Processing metrics
  processingStartedAt: Date,
  processingCompletedAt: Date,
  
  // Automatic retry settings
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Escalation settings
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedAt: Date,
  
  // SLA settings
  slaDeadline: Date,
  slaBreached: {
    type: Boolean,
    default: false
  },
  
  // Auto-assignment rules
  autoAssigned: {
    type: Boolean,
    default: false
  },
  assignmentRules: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes for performance
queueSchema.index({ type: 1, status: 1, priority: 1, createdAt: 1 })
queueSchema.index({ assignedTo: 1, status: 1 })
queueSchema.index({ submittedBy: 1, status: 1 })
queueSchema.index({ slaDeadline: 1, status: 1 })
queueSchema.index({ type: 1, referenceId: 1 })

// Static methods for queue management
queueSchema.statics = {
  // Add item to queue
  async addToQueue(type, referenceId, submittedBy, options = {}) {
    const queueItem = new this({
      type,
      referenceId,
      submittedBy,
      priority: options.priority || 'medium',
      data: options.data || {},
      estimatedProcessingTime: options.estimatedProcessingTime || 30,
      slaDeadline: options.slaDeadline || new Date(Date.now() + (options.slaHours || 24) * 60 * 60 * 1000)
    })
    
    await queueItem.save()
    
    // Update queue positions
    await this.updateQueuePositions(type)
    
    return queueItem
  },
  
  // Get next item from queue
  async getNextItem(type, assignedTo = null) {
    const nextItem = await this.findOne({
      type,
      status: 'pending',
      assignedTo: { $in: [null, assignedTo] }
    })
    .sort({ priority: -1, createdAt: 1 })
    .populate('submittedBy', 'name email')
    .populate('referenceId')
    
    return nextItem
  },
  
  // Assign item to user
  async assignItem(queueId, assignedTo) {
    const item = await this.findByIdAndUpdate(
      queueId,
      {
        assignedTo,
        status: 'processing',
        processingStartedAt: new Date(),
        autoAssigned: false
      },
      { new: true }
    ).populate('submittedBy assignedTo', 'name email')
    
    return item
  },
  
  // Auto-assign items based on workload
  async autoAssignItems(type, availableUsers) {
    const pendingItems = await this.find({
      type,
      status: 'pending',
      assignedTo: null
    }).sort({ priority: -1, createdAt: 1 })
    
    for (const item of pendingItems) {
      // Find user with lowest workload
      const userWorkloads = await Promise.all(
        availableUsers.map(async (userId) => {
          const workload = await this.countDocuments({
            assignedTo: userId,
            status: 'processing'
          })
          return { userId, workload }
        })
      )
      
      userWorkloads.sort((a, b) => a.workload - b.workload)
      const bestUser = userWorkloads[0]?.userId
      
      if (bestUser) {
        await this.findByIdAndUpdate(item._id, {
          assignedTo: bestUser,
          status: 'processing',
          processingStartedAt: new Date(),
          autoAssigned: true
        })
      }
    }
  },
  
  // Complete queue item
  async completeItem(queueId, completionData = {}) {
    const item = await this.findById(queueId)
    
    if (!item) {
      throw new Error('Queue item not found')
    }
    
    const actualProcessingTime = item.processingStartedAt 
      ? Math.round((Date.now() - item.processingStartedAt.getTime()) / (1000 * 60))
      : 0
    
    const updatedItem = await this.findByIdAndUpdate(
      queueId,
      {
        status: 'completed',
        processingCompletedAt: new Date(),
        actualProcessingTime,
        data: { ...item.data, ...completionData }
      },
      { new: true }
    )
    
    // Update queue positions
    await this.updateQueuePositions(item.type)
    
    return updatedItem
  },
  
  // Update queue positions
  async updateQueuePositions(type) {
    const pendingItems = await this.find({
      type,
      status: 'pending'
    }).sort({ priority: -1, createdAt: 1 })
    
    for (let i = 0; i < pendingItems.length; i++) {
      await this.findByIdAndUpdate(pendingItems[i]._id, {
        position: i + 1
      })
    }
  },
  
  // Get queue statistics
  async getQueueStats(type = null) {
    const matchCondition = type ? { type } : {}
    
    const stats = await this.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProcessingTime: { $avg: '$actualProcessingTime' }
        }
      }
    ])
    
    const priorityStats = await this.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ])
    
    const slaStats = await this.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          breached: {
            $sum: { $cond: ['$slaBreached', 1, 0] }
          }
        }
      }
    ])
    
    return {
      byStatus: stats,
      byPriority: priorityStats,
      sla: slaStats[0] || { total: 0, breached: 0 }
    }
  },
  
  // Check for SLA breaches
  async checkSLABreaches() {
    const now = new Date()
    const breachedItems = await this.find({
      status: 'pending',
      slaDeadline: { $lt: now },
      slaBreached: false
    })
    
    for (const item of breachedItems) {
      await this.findByIdAndUpdate(item._id, {
        slaBreached: true,
        escalated: true,
        escalatedAt: now
      })
      
      // Trigger escalation notification
      // This would integrate with your notification system
      console.log(`SLA breached for queue item ${item._id}`)
    }
    
    return breachedItems.length
  }
}

// Instance methods
queueSchema.methods = {
  // Add note to queue item
  async addNote(content, addedBy) {
    this.notes.push({ content, addedBy })
    return this.save()
  },
  
  // Escalate item
  async escalate(escalatedTo) {
    this.escalated = true
    this.escalatedTo = escalatedTo
    this.escalatedAt = new Date()
    return this.save()
  },
  
  // Retry processing
  async retry() {
    if (this.retryCount >= this.maxRetries) {
      this.status = 'failed'
    } else {
      this.status = 'pending'
      this.assignedTo = null
      this.retryCount += 1
      this.processingStartedAt = null
      this.processingCompletedAt = null
    }
    return this.save()
  },
  
  // Calculate estimated wait time
  async getEstimatedWaitTime() {
    if (this.status !== 'pending') return 0
    
    const itemsAhead = await this.countDocuments({
      type: this.type,
      status: 'pending',
      createdAt: { $lt: this.createdAt }
    })
    
    const avgProcessingTime = 30 // minutes (could be calculated from historical data)
    return itemsAhead * avgProcessingTime
  }
}

module.exports = mongoose.model('Queue', queueSchema)
