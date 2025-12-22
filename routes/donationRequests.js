
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

router.get('/public', getPublicDonationRequests);
router.get('/:id', getDonationRequestById);

router.post('/', auth, createDonationRequest);
router.get('/', auth, getAllDonationRequests);
router.put('/:id', auth, updateDonationRequest);
router.delete('/:id', auth, deleteDonationRequest);
router.post('/:id/donate', auth, donateToRequest);

module.exports = router;