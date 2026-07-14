const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// ทุกเส้นทางใน Router นี้ต้องล็อกอินก่อน
router.use(protect);

// 1. แดชบอร์ดข้อมูลภาพรวมสรุป (เฉพาะ Admin เท่านั้น)
router.get('/dashboard', restrictTo('admin'), adminController.getDashboardMetrics);

// 2. จัดการคำสั่งซื้อ (สิทธิ์ร่วมของ Admin และ Accounting)
router.get('/orders', restrictTo('admin', 'accounting'), adminController.getAllOrders);
router.put('/orders/:id/status', restrictTo('admin', 'accounting'), adminController.updateOrderStatus);

// 3. จัดการข้อมูลผู้ใช้/สมาชิก (เฉพาะ Admin เท่านั้น)
router.get('/customers', restrictTo('admin'), adminController.getAllCustomers);
router.put('/customers/:id/status', restrictTo('admin'), adminController.toggleCustomerStatus);
router.get('/customers/:id/orders', restrictTo('admin'), adminController.getCustomerOrders);

// 4. จัดการข้อมูลสินค้าคลัง (สิทธิ์ร่วมของ Admin และ Stock)
router.get('/products', restrictTo('admin', 'stock'), adminController.getAllProductsAdmin);
router.post('/products', restrictTo('admin', 'stock'), adminController.createProduct);
router.put('/products/:id', restrictTo('admin', 'stock'), adminController.updateProduct);
router.delete('/products/:id', restrictTo('admin', 'stock'), adminController.deleteProduct);
router.put('/products/variants/:id', restrictTo('admin', 'stock'), adminController.updateProductVariant);

// 5. ระบบส่งออกไฟล์ CSV
router.get('/export/orders', restrictTo('admin', 'accounting'), adminController.exportOrdersCSV);
router.get('/export/products', restrictTo('admin', 'stock'), adminController.exportProductsCSV);

module.exports = router;
