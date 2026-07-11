const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect } = require('../middlewares/authMiddleware');

// ทุก route ต้องผ่านการล็อกอินก่อน
router.use(protect);

router.get('/', addressController.getAddresses);
router.post('/', addressController.addAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/set-default', addressController.setDefaultAddress);

module.exports = router;
