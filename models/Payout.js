import mongoose from 'mongoose'

const payoutSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'KES'
  },
  orders: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    amount: Number,
    fee: Number,
    date: Date
  }],
  payoutMethod: {
    type: String,
    required: true,
    enum: ['mpesa', 'bank_transfer', 'mobile_money']
  },
  payoutDetails: {
    // M-Pesa details
    phoneNumber: String,
    // Bank transfer details
    bankName: String,
    accountNumber: String,
    accountName: String,
    // Mobile money details
    provider: String,
    mobileNumber: String
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    sparse: true
  },
  providerTransactionId: {
    type: String,
    sparse: true
  },
  processingDate: Date,
  completedDate: Date,
  failureReason: String,
  notes: String,
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes
payoutSchema.index({ seller: 1, status: 1 })
payoutSchema.index({ status: 1, createdAt: -1 })
payoutSchema.index({ 'period.startDate': 1, 'period.endDate': 1 })

// Methods
payoutSchema.methods.calculateAmounts = function() {
  let totalAmount = 0
  let totalFee = 0
  
  this.orders.forEach(order => {
    totalAmount += order.amount
    totalFee += order.fee
  })
  
  this.totalAmount = totalAmount
  this.fee = totalFee
  this.netAmount = totalAmount - totalFee
  
  return this.save()
}

payoutSchema.methods.markCompleted = function(transactionId) {
  this.status = 'completed'
  this.completedDate = new Date()
  this.transactionId = transactionId
  return this.save()
}

payoutSchema.methods.markFailed = function(reason) {
  this.status = 'failed'
  this.failureReason = reason
  return this.save()
}

const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema)

export default Payout
