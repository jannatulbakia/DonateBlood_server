// routes/donationRequests.js
const express = require('express');
const router = express.Router();
const {
  createDonationRequest,
  getAllDonationRequests,
  getPublicDonationRequests,
  getDonationRequestById,
  updateDonationRequest,
  deleteDonationRequest,
  donateToRequest
} = require('../controllers/donationRequestController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.get('/public', getPublicDonationRequests);
router.get('/:id', getDonationRequestById);

// Protected routes
router.post('/', auth, createDonationRequest);  // This is the correct endpoint
router.get('/', auth, getAllDonationRequests);
router.put('/:id', auth, updateDonationRequest);
router.delete('/:id', auth, deleteDonationRequest);
router.post('/:id/donate', auth, donateToRequest);

module.exports = router;