const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pair: {
    type: String,
    required: true,
    enum: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD']
  },
  type: {
    type: String,
    required: true,
    enum: ['CALL', 'PUT']
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: Number,
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'EXPIRED'],
    default: 'OPEN'
  },
  result: {
    type: String,
    enum: ['WIN', 'LOSS', 'DRAW', null],
    default: null
  },
  profitLoss: Number,
  expiration: {
    type: Date,
    required: true
  },
  duration: {
    type: String,
    required: true,
    enum: ['1m', '5m', '15m', '1h', '4h', '1d']
  },
  returnPercentage: {
    type: Number,
    default: 80
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date
});

module.exports = mongoose.model('Trade', tradeSchema);
