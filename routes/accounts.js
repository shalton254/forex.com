const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get account details
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      accountBalance: user.accountBalance,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, country } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { firstName, lastName, phone, country, updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get account statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const Trade = require('../models/Trade');
    
    const user = await User.findById(req.userId);
    const trades = await Trade.find({ userId: req.userId });
    
    const winTrades = trades.filter(t => t.result === 'WIN').length;
    const lossTrades = trades.filter(t => t.result === 'LOSS').length;
    const winRate = trades.length > 0 ? (winTrades / trades.length * 100).toFixed(2) : 0;
    
    const totalProfit = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

    res.json({
      accountBalance: user.accountBalance,
      totalTrades: trades.length,
      winTrades,
      lossTrades,
      winRate: parseFloat(winRate),
      totalProfit,
      totalDeposited: user.totalDeposited,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
