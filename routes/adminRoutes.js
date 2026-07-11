const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// กำหนดให้ทุกเส้นทางใน Router นี้ต้องล็อกอินและเป็น Admin เท่านั้น (RBAC)
router.use(protect, restrictTo('admin'));

// 1. แดชบอร์ดข้อมูลภาพรวมสรุป
router.get('/dashboard', adminController.getDashboardMetrics);

// 2. จัดการคำสั่งซื้อ
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// 3. จัดการข้อมูลผู้ใช้/สมาชิก
router.get('/customers', adminController.getAllCustomers);
router.put('/customers/:id/status', adminController.toggleCustomerStatus);
router.get('/customers/:id/orders', adminController.getCustomerOrders);

// 4. จัดการข้อมูลสินค้าคลัง (Inventory & Products)
router.get('/products', adminController.getAllProductsAdmin);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.put('/products/variants/:id', adminController.updateProductVariant);

module.exports = router;
