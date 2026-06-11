const express = require('express');
const Trade = require('../models/Trade');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Place a new trade
router.post('/place', authenticate, async (req, res) => {
  try {
    const { pair, type, amount, duration, returnPercentage } = req.body;

    if (!pair || !type || !amount || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.accountBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const entryPrice = Math.random() * 100 + 50;

    const durationMs = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000
    }[duration];

    const expiration = new Date(Date.now() + durationMs);

    const trade = new Trade({
      userId: req.userId,
      pair,
      type,
      amount,
      entryPrice,
      status: 'OPEN',
      expiration,
      duration,
      returnPercentage: returnPercentage || 80
    });

    await trade.save();

    user.accountBalance -= amount;
    await user.save();

    res.status(201).json({
      message: 'Trade placed successfully',
      trade
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's trades
router.get('/', authenticate, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get trade by ID
router.get('/:tradeId', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findOne({
      _id: req.params.tradeId,
      userId: req.userId
    });

    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json(trade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Close a trade manually
router.post('/:tradeId/close', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findOne({
      _id: req.params.tradeId,
      userId: req.userId
    });

    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    if (trade.status !== 'OPEN') {
      return res.status(400).json({ message: 'Trade is not open' });
    }

    const exitPrice = Math.random() * 100 + 50;
    const isWin = (trade.type === 'CALL' && exitPrice > trade.entryPrice) ||
                  (trade.type === 'PUT' && exitPrice < trade.entryPrice);

    const profitLoss = isWin ? (trade.amount * trade.returnPercentage / 100) : -trade.amount;

    trade.exitPrice = exitPrice;
    trade.status = 'CLOSED';
    trade.result = isWin ? 'WIN' : 'LOSS';
    trade.profitLoss = profitLoss;
    trade.closedAt = new Date();

    await trade.save();

    const user = await User.findById(req.userId);
    user.accountBalance += trade.amount + profitLoss;
    await user.save();

    res.json({
      message: 'Trade closed successfully',
      trade,
      newBalance: user.accountBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
