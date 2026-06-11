const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  method: {
    type: String,
    required: true,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'E_WALLET']
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  transactionId: {
    type: String,
    unique: true
  },
  stripePaymentIntentId: String,
  reference: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Deposit', depositSchema);
