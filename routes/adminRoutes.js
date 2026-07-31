const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// 1. แดชบอร์ดข้อมูลภาพรวมสรุป (admin, accounting)
router.get('/dashboard', protect, restrictTo('admin', 'accounting'), adminController.getDashboardMetrics);

// 2. จัดการคำสั่งซื้อ (admin, accounting)
router.get('/orders', protect, restrictTo('admin', 'accounting'), adminController.getAllOrders);
router.put('/orders/:id/status', protect, restrictTo('admin', 'accounting'), adminController.updateOrderStatus);

// 3. จัดการข้อมูลผู้ใช้/สมาชิก (admin Only)
router.get('/customers', protect, restrictTo('admin'), adminController.getAllCustomers);
router.put('/customers/:id/status', protect, restrictTo('admin'), adminController.toggleCustomerStatus);
router.get('/customers/:id/orders', protect, restrictTo('admin'), adminController.getCustomerOrders);

// 4. จัดการข้อมูลสินค้าคลัง (admin, stock)
router.get('/products', protect, restrictTo('admin', 'stock'), adminController.getAllProductsAdmin);
router.post('/products', protect, restrictTo('admin', 'stock'), adminController.createProduct);
router.put('/products/:id', protect, restrictTo('admin', 'stock'), adminController.updateProduct);
router.delete('/products/:id', protect, restrictTo('admin', 'stock'), adminController.deleteProduct);
router.put('/products/variants/:id', protect, restrictTo('admin', 'stock'), adminController.updateProductVariant);

module.exports = router;
