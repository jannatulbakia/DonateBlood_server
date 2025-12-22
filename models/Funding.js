const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const fundingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least 1']
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'stripe'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

fundingSchema.plugin(paginate);

module.exports = mongoose.model('Funding', fundingSchema);