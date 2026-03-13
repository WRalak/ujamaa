import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    price: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    }
  }],
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Update total items when items change
wishlistSchema.methods.calculateTotal = function() {
  this.totalItems = this.items.length
  return this.save()
}

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema)

export default Wishlist
