const express = require('express');
const router = express.Router();
const {
  checkout, confirmOrder, getMyOrders, getOrder, stripeWebhook,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Stripe publishable key for frontend
router.get('/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// Webhook must use raw body - defined in index.js before json middleware
router.post('/checkout', protect, checkout);
router.post('/confirm', protect, confirmOrder);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrder);

module.exports = router;
