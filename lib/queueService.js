const Queue = require('../models/Queue')
const User = require('../models/User')

class QueueService {
  constructor() {
    this.queueTypes = {
      SHOP_VERIFICATION: 'shop_verification',
      PRODUCT_REVIEW: 'product_review',
      SUPPORT_TICKET: 'support_ticket',
      PAYOUT_PROCESSING: 'payout_processing',
      USER_REPORT: 'user_report',
      CONTENT_MODERATION: 'content_moderation'
    }
    
    this.priorities = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      URGENT: 'urgent'
    }
    
    this.statuses = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled'
    }
  }

  // Add item to queue
  async addToQueue(type, referenceId, submittedBy, options = {}) {
    try {
      const queueItem = await Queue.addToQueue(type, referenceId, submittedBy, options)
      
      // Trigger auto-assignment if enabled
      if (options.autoAssign) {
        await this.autoAssignItems(type)
      }
      
      return queueItem
    } catch (error) {
      console.error('Error adding to queue:', error)
      throw error
    }
  }

  // Get next item from queue
  async getNextItem(type, assignedTo = null) {
    try {
      return await Queue.getNextItem(type, assignedTo)
    } catch (error) {
      console.error('Error getting next queue item:', error)
      throw error
    }
  }

  // Assign item to user
  async assignItem(queueId, assignedTo) {
    try {
      return await Queue.assignItem(queueId, assignedTo)
    } catch (error) {
      console.error('Error assigning queue item:', error)
      throw error
    }
  }

  // Complete queue item
  async completeItem(queueId, completionData = {}) {
    try {
      return await Queue.completeItem(queueId, completionData)
    } catch (error) {
      console.error('Error completing queue item:', error)
      throw error
    }
  }

  // Auto-assign items based on workload
  async autoAssignItems(type) {
    try {
      // Get available users for this queue type
      const availableUsers = await this.getAvailableUsers(type)
      
      if (availableUsers.length === 0) {
        console.log(`No available users for queue type: ${type}`)
        return 0
      }
      
      return await Queue.autoAssignItems(type, availableUsers)
    } catch (error) {
      console.error('Error auto-assigning items:', error)
      throw error
    }
  }

  // Get available users for queue type
  async getAvailableUsers(type) {
    // This would be based on user roles and permissions
    // For now, return all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('_id')
    return adminUsers.map(user => user._id)
  }

  // Get queue statistics
  async getQueueStats(type = null) {
    try {
      return await Queue.getQueueStats(type)
    } catch (error) {
      console.error('Error getting queue stats:', error)
      throw error
    }
  }

  // Get user's queue items
  async getUserQueueItems(userId, status = null) {
    try {
      const query = { assignedTo: userId }
      if (status) {
        query.status = status
      }
      
      return await Queue.find(query)
        .sort({ priority: -1, createdAt: 1 })
        .populate('submittedBy', 'name email')
        .populate('referenceId')
    } catch (error) {
      console.error('Error getting user queue items:', error)
      throw error
    }
  }

  // Add note to queue item
  async addNote(queueId, content, addedBy) {
    try {
      const queueItem = await Queue.findById(queueId)
      if (!queueItem) {
        throw new Error('Queue item not found')
      }
      
      return await queueItem.addNote(content, addedBy)
    } catch (error) {
      console.error('Error adding note to queue item:', error)
      throw error
    }
  }

  // Escalate item
  async escalateItem(queueId, escalatedTo) {
    try {
      const queueItem = await Queue.findById(queueId)
      if (!queueItem) {
        throw new Error('Queue item not found')
      }
      
      return await queueItem.escalate(escalatedTo)
    } catch (error) {
      console.error('Error escalating queue item:', error)
      throw error
    }
  }

  // Retry failed item
  async retryItem(queueId) {
    try {
      const queueItem = await Queue.findById(queueId)
      if (!queueItem) {
        throw new Error('Queue item not found')
      }
      
      return await queueItem.retry()
    } catch (error) {
      console.error('Error retrying queue item:', error)
      throw error
    }
  }

  // Cancel queue item
  async cancelItem(queueId) {
    try {
      return await Queue.findByIdAndUpdate(
        queueId,
        {
          status: this.statuses.CANCELLED,
          processingCompletedAt: new Date()
        },
        { new: true }
      )
    } catch (error) {
      console.error('Error cancelling queue item:', error)
      throw error
    }
  }

  // Check for SLA breaches
  async checkSLABreaches() {
    try {
      return await Queue.checkSLABreaches()
    } catch (error) {
      console.error('Error checking SLA breaches:', error)
      throw error
    }
  }

  // Get queue performance metrics
  async getQueuePerformance(type = null, timeRange = '24h') {
    try {
      const now = new Date()
      let timeFilter
      
      switch (timeRange) {
        case '1h':
          timeFilter = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
      
      const matchCondition = {
        createdAt: { $gte: timeFilter }
      }
      
      if (type) {
        matchCondition.type = type
      }
      
      const performance = await Queue.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$type',
            totalItems: { $sum: 1 },
            completedItems: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedItems: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            avgProcessingTime: { $avg: '$actualProcessingTime' },
            slaBreached: {
              $sum: { $cond: ['$slaBreached', 1, 0] }
            }
          }
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $eq: ['$totalItems', 0] },
                0,
                { $multiply: [{ $divide: ['$completedItems', '$totalItems'] }, 100] }
              ]
            },
            failureRate: {
              $cond: [
                { $eq: ['$totalItems', 0] },
                0,
                { $multiply: [{ $divide: ['$failedItems', '$totalItems'] }, 100] }
              ]
            },
            slaBreachRate: {
              $cond: [
                { $eq: ['$totalItems', 0] },
                0,
                { $multiply: [{ $divide: ['$slaBreached', '$totalItems'] }, 100] }
              ]
            }
          }
        }
      ])
      
      return performance
    } catch (error) {
      console.error('Error getting queue performance:', error)
      throw error
    }
  }

  // Get user workload
  async getUserWorkload(userId) {
    try {
      const workload = await Queue.aggregate([
        { $match: { assignedTo: userId, status: 'processing' } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgProcessingTime: { $avg: '$actualProcessingTime' }
          }
        }
      ])
      
      const totalWorkload = workload.reduce((sum, item) => sum + item.count, 0)
      
      return {
        totalWorkload,
        byType: workload
      }
    } catch (error) {
      console.error('Error getting user workload:', error)
      throw error
    }
  }

  // Get estimated wait time for queue type
  async getEstimatedWaitTime(type) {
    try {
      const nextItem = await Queue.findOne({
        type,
        status: 'pending'
      }).sort({ priority: -1, createdAt: 1 })
      
      if (!nextItem) return 0
      
      return await nextItem.getEstimatedWaitTime()
    } catch (error) {
      console.error('Error getting estimated wait time:', error)
      throw error
    }
  }

  // Process queue item with timeout
  async processQueueItem(queueId, processingFunction, timeout = 30 * 60 * 1000) {
    try {
      const queueItem = await Queue.findById(queueId)
      if (!queueItem) {
        throw new Error('Queue item not found')
      }
      
      // Mark as processing
      await Queue.findByIdAndUpdate(queueId, {
        status: 'processing',
        processingStartedAt: new Date()
      })
      
      // Execute processing function with timeout
      const result = await Promise.race([
        processingFunction(queueItem),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Processing timeout')), timeout)
        )
      ])
      
      // Mark as completed
      await this.completeItem(queueId, result)
      
      return result
    } catch (error) {
      console.error('Error processing queue item:', error)
      
      // Mark as failed and retry if possible
      const queueItem = await Queue.findById(queueId)
      if (queueItem && queueItem.retryCount < queueItem.maxRetries) {
        await queueItem.retry()
      } else {
        await Queue.findByIdAndUpdate(queueId, {
          status: 'failed',
          processingCompletedAt: new Date()
        })
      }
      
      throw error
    }
  }

  // Clean up old completed items
  async cleanupOldItems(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
      
      const result = await Queue.deleteMany({
        status: { $in: ['completed', 'failed', 'cancelled'] },
        processingCompletedAt: { $lt: cutoffDate }
      })
      
      console.log(`Cleaned up ${result.deletedCount} old queue items`)
      return result.deletedCount
    } catch (error) {
      console.error('Error cleaning up old queue items:', error)
      throw error
    }
  }

  // Get queue health metrics
  async getQueueHealth() {
    try {
      const stats = await this.getQueueStats()
      const performance = await this.getQueuePerformance(null, '24h')
      
      const health = {
        overall: 'healthy',
        issues: [],
        metrics: {
          totalItems: stats.byStatus.reduce((sum, stat) => sum + stat.count, 0),
          pendingItems: stats.byStatus.find(s => s._id === 'pending')?.count || 0,
          processingItems: stats.byStatus.find(s => s._id === 'processing')?.count || 0,
          completedItems: stats.byStatus.find(s => s._id === 'completed')?.count || 0,
          failedItems: stats.byStatus.find(s => s._id === 'failed')?.count || 0,
          slaBreachRate: stats.sla.total > 0 ? (stats.sla.breached / stats.sla.total) * 100 : 0
        }
      }
      
      // Determine health status
      if (health.metrics.slaBreachRate > 20) {
        health.overall = 'critical'
        health.issues.push('High SLA breach rate')
      } else if (health.metrics.slaBreachRate > 10) {
        health.overall = 'warning'
        health.issues.push('Elevated SLA breach rate')
      }
      
      if (health.metrics.failedItems > health.metrics.completedItems * 0.1) {
        health.overall = 'warning'
        health.issues.push('High failure rate')
      }
      
      return health
    } catch (error) {
      console.error('Error getting queue health:', error)
      throw error
    }
  }
}

module.exports = new QueueService()
