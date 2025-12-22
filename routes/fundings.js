const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  getAllFundings,
  getFundingStats,
  getUserFundings
} = require('../controllers/fundingController');
const { auth, authorize } = require('../middleware/auth');

// Protected routes
router.post('/create-payment-intent', auth, createPaymentIntent);
router.post('/confirm-payment', auth, confirmPayment);
router.get('/', auth, getAllFundings);
router.get('/my-fundings', auth, getUserFundings);
router.get('/stats', auth, authorize('admin', 'volunteer'), getFundingStats);

module.exports = router;