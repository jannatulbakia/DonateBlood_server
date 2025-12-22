const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  searchDonors,
  getDashboardStats,
  getBangladeshData,
  getUpazilas
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.get('/search', searchDonors);
router.get('/bangladesh/districts', getBangladeshData);
router.get('/bangladesh/upazilas/:district', getUpazilas);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/dashboard/stats', auth, getDashboardStats);

// Admin only routes
router.get('/all', auth, authorize('admin'), getAllUsers);
router.put('/:userId/status', auth, authorize('admin'), updateUserStatus);
router.put('/:userId/role', auth, authorize('admin'), updateUserRole);

module.exports = router;