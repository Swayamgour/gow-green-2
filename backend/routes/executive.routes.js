const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getAllExecutives,
  getExecutiveById,
  createExecutive,
  updateExecutive,
  deleteExecutive,
  updateExecutivePassword,
  viewExecutivePassword,
} = require('../controllers/executive.controller');


router.get('/', protect, getAllExecutives);
router.post('/', protect, adminOnly, upload.single('avatar'), createExecutive);
router.patch('/:id/password', protect, adminOnly, updateExecutivePassword);
router.get('/:id/view-password',  adminOnly, viewExecutivePassword);
router.get('/:id', protect, getExecutiveById);
router.put('/:id', protect, adminOnly, upload.single('avatar'), updateExecutive);
router.delete('/:id', protect, adminOnly, deleteExecutive);

module.exports = router;