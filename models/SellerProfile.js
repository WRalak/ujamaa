import mongoose from 'mongoose'

const sellerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true,
    enum: ['individual', 'company', 'partnership']
  },
  description: {
    type: String,
    maxlength: 1000
  },
  logo: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  businessDocuments: [{
    type: {
      type: String,
      enum: ['business_license', 'tax_certificate', 'id_document', 'other']
    },
    documentUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationDate: Date,
  rejectionReason: String,
  
  // Seller performance metrics
  stats: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number, // in hours
      default: 24
    },
    fulfillmentRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },
  
  // Seller settings
  settings: {
    autoAcceptOrders: {
      type: Boolean,
      default: false
    },
    shippingOptions: [{
      name: String,
      cost: Number,
      estimatedDays: String,
      regions: [String]
    }],
    returnPolicy: {
      enabled: {
        type: Boolean,
        default: true
      },
      days: {
        type: Number,
        default: 7
      },
      conditions: String
    }
  },
  
  // Payout information
  payoutInfo: {
    method: {
      type: String,
      enum: ['mpesa', 'bank_transfer', 'mobile_money'],
      required: true
    },
    details: {
      // For M-Pesa
      phoneNumber: String,
      // For bank transfer
      bankName: String,
      accountNumber: String,
      accountName: String,
      // For mobile money
      provider: String,
      mobileNumber: String
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  suspensionDate: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes
sellerProfileSchema.index({ user: 1 })
sellerProfileSchema.index({ verificationStatus: 1 })
sellerProfileSchema.index({ 'stats.averageRating': -1 })
sellerProfileSchema.index({ 'stats.totalSales': -1 })

// Methods
sellerProfileSchema.methods.updateStats = async function(orderData) {
  if (orderData.type === 'sale') {
    this.stats.totalSales += orderData.amount
    this.stats.totalOrders += 1
  } else if (orderData.type === 'rating') {
    const totalRatingPoints = this.stats.averageRating * this.stats.totalReviews
    this.stats.totalReviews += 1
    this.stats.averageRating = (totalRatingPoints + orderData.rating) / this.stats.totalReviews
  }
  
  return this.save()
}

sellerProfileSchema.methods.calculateFulfillmentRate = async function() {
  const Order = mongoose.model('Order')
  const totalOrders = await Order.countDocuments({ 
    seller: this.user,
    orderStatus: { $in: ['delivered', 'cancelled'] }
  })
  const deliveredOrders = await Order.countDocuments({ 
    seller: this.user,
    orderStatus: 'delivered'
  })
  
  this.stats.fulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 100
  return this.save()
}

const SellerProfile = mongoose.models.SellerProfile || mongoose.model('SellerProfile', sellerProfileSchema)

export default SellerProfile
