import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['mpesa', 'airtel_money', 'tigopesa', 'vodacom_mpesa', 'credit_card', 'cash_on_delivery']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'TZS', 'UGX', 'RWF', 'BIF']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  providerTransactionId: {
    type: String,
    sparse: true
  },
  phoneNumber: {
    type: String,
    required: function() {
      return ['mpesa', 'airtel_money', 'tigopesa', 'vodacom_mpesa'].includes(this.method)
    }
  },
  checkoutRequestID: {
    type: String,
    sparse: true
  },
  merchantRequestID: {
    type: String,
    sparse: true
  },
  mpesaResponse: {
    type: mongoose.Schema.Types.Mixed,
    sparse: true
  },
  failureReason: {
    type: String,
    sparse: true
  },
  processedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Generate transaction ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'PAY' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
  }
  next()
})

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema)

export default Payment
