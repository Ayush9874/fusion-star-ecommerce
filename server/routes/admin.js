const express = require('express');
const router = express.Router();
const {
  getStats, getAllOrders, updateOrderStatus, getAllUsers, updateUserRole, getLowStock,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/low-stock', getLowStock);

module.exports = router;
