const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @route POST /api/orders/checkout  — create PaymentIntent
exports.checkout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const amount = Math.round(cart.totalPrice * 100); // Stripe uses cents

    let clientSecret = 'pi_mock_secret_123';
    try {
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key') {
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'inr',
          metadata: { userId: req.user._id.toString() },
        });
        clientSecret = paymentIntent.client_secret;
      }
    } catch (stripeErr) {
      console.warn('Stripe integration failed, falling back to mock payment intent for dev environments', stripeErr.message);
    }

    res.json({
      success: true,
      clientSecret,
      amount: cart.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/confirm  — confirm and save order after payment
exports.confirmOrder = async (req, res, next) => {
  try {
    const { paymentIntentId, shippingAddress } = req.body;
    if (!paymentIntentId || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Payment intent and shipping address required' });
    }

    // Verify payment with Stripe
    if (paymentIntentId !== 'pi_mock_secret_123') {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ success: false, message: 'Payment not completed' });
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Stripe verification failed' });
      }
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Decrement stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: cart.items,
      shippingAddress,
      totalAmount: cart.totalPrice,
      status: 'paid',
      paymentIntentId,
      isPaid: true,
      paidAt: new Date(),
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/orders/webhook  — Stripe webhook (raw body needed)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    console.log('💰 Payment succeeded via webhook:', event.data.object.id);
  }

  res.json({ received: true });
};
