const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
  },
  type: {
    type: String,
    enum: ['earned', 'bought', 'sold', 'retired'],
    required: true,
  },
  proofId: { type: String, index: true, sparse: true }, // public retirement proof id
  credits: {
    type: Number,
    required: true,
  },
  amount: Number, // price in USD
  co2Offset: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  blockchainHash: String,
  description: String,
}, {
  timestamps: true,
});

transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
