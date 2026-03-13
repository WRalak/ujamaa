import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  images: [{
    type: String
  }],
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  response: {
    content: String,
    date: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  flaggedReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Ensure one review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true })
reviewSchema.index({ product: 1, status: 1 })
reviewSchema.index({ rating: -1 })
reviewSchema.index({ createdAt: -1 })

// Pre-save middleware to update product ratings
reviewSchema.pre('save', async function(next) {
  if (this.isModified('rating') || this.isModified('status')) {
    if (this.status === 'approved') {
      const Product = mongoose.model('Product')
      const product = await Product.findById(this.product)
      
      if (product) {
        // Update product rating
        const reviews = await mongoose.model('Review').find({
          product: this.product,
          status: 'approved'
        })
        
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
          product.ratings.average = totalRating / reviews.length
          product.ratings.count = reviews.length
        } else {
          product.ratings.average = 0
          product.ratings.count = 0
        }
        
        await product.save()
      }
    }
  }
  next()
})

// Methods
reviewSchema.methods.markHelpful = async function() {
  this.helpful += 1
  return this.save()
}

reviewSchema.methods.markNotHelpful = async function() {
  this.notHelpful += 1
  return this.save()
}

reviewSchema.methods.addResponse = async function(content, respondedBy) {
  this.response = {
    content,
    date: new Date(),
    respondedBy
  }
  return this.save()
}

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema)

export default Review
