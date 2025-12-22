const DonationRequest = require('../models/DonationRequest');
const User = require('../models/User');

// Create Donation Request - FIXED VERSION
const createDonationRequest = async (req, res) => {
  try {
    console.log('Creating donation request...');
    console.log('Request body:', req.body);
    console.log('User:', req.user._id);

    // Check if user is active
    if (req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked. You cannot create donation requests.'
      });
    }

    const {
      recipientName,
      recipientDistrict,
      recipientUpazila,
      hospitalName,
      fullAddress,
      bloodGroup,
      donationDate,
      donationTime,
      requestMessage
    } = req.body;

    // Validate required fields
    if (!recipientName || !recipientDistrict || !recipientUpazila || !hospitalName || 
        !fullAddress || !bloodGroup || !donationDate || !donationTime || !requestMessage) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Create donation request
    const donationRequest = new DonationRequest({
      requester: req.user._id,
      recipientName,
      recipientDistrict,
      recipientUpazila,
      hospitalName,
      fullAddress,
      bloodGroup,
      donationDate: new Date(donationDate),
      donationTime,
      requestMessage,
      status: 'pending'
    });

    await donationRequest.save();
    console.log('Donation request saved:', donationRequest._id);

    // Populate the request with user data
    const populatedRequest = await DonationRequest.findById(donationRequest._id)
      .populate('requester', 'name email avatar')
      .populate('donor', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Donation request created successfully',
      donationRequest: populatedRequest
    });
  } catch (error) {
    console.error('Create donation request error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating donation request',
      error: error.message
    });
  }
};

// Get All Donation Requests
const getAllDonationRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      requesterId,
      donorId 
    } = req.query;
    
    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (requesterId) query.requester = requesterId;
    if (donorId) query.donor = donorId;

    // For regular donors, only show their own requests
    if (req.user.role === 'donor') {
      query.requester = req.user._id;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'requester', select: 'name email avatar' },
        { path: 'donor', select: 'name email avatar' }
      ]
    };

    const donationRequests = await DonationRequest.paginate(query, options);

    res.status(200).json({
      success: true,
      donationRequests
    });
  } catch (error) {
    console.error('Get all donation requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting donation requests',
      error: error.message
    });
  }
};

// Get Public Donation Requests
const getPublicDonationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, bloodGroup, district } = req.query;
    const query = { status: 'pending' };

    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (district) query.recipientDistrict = district;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'requester', select: 'name email avatar district upazila' }
      ]
    };

    const donationRequests = await DonationRequest.paginate(query, options);

    res.status(200).json({
      success: true,
      donationRequests
    });
  } catch (error) {
    console.error('Get public donation requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting donation requests',
      error: error.message
    });
  }
};

// Get Single Donation Request by ID
const getDonationRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const donationRequest = await DonationRequest.findById(id)
      .populate('requester', 'name email avatar district upazila')
      .populate('donor', 'name email avatar');

    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    res.status(200).json({
      success: true,
      donationRequest
    });
  } catch (error) {
    console.error('Get donation request by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting donation request',
      error: error.message
    });
  }
};

// Update Donation Request
const updateDonationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check permissions
    const donationRequest = await DonationRequest.findById(id);
    
    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    // Permission checks
    if (req.user.role === 'donor' && donationRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own donation requests'
      });
    }

    // Volunteers can only update status
    if (req.user.role === 'volunteer') {
      if (!updateData.status) {
        return res.status(403).json({
          success: false,
          message: 'Volunteers can only update donation status'
        });
      }
      // Only allow status field for volunteers
      const filteredData = { status: updateData.status };
      return updateDonation(id, filteredData, res);
    }

    // Admins and request owners can update all fields
    await updateDonation(id, updateData, res);
  } catch (error) {
    console.error('Update donation request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donation request',
      error: error.message
    });
  }
};

// Helper function to update donation request
const updateDonation = async (id, updateData, res) => {
  try {
    // If donationDate is provided, convert to Date object
    if (updateData.donationDate) {
      updateData.donationDate = new Date(updateData.donationDate);
    }

    const updatedRequest = await DonationRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('requester', 'name email avatar')
    .populate('donor', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Donation request updated successfully',
      donationRequest: updatedRequest
    });
  } catch (error) {
    throw error;
  }
};

// Delete Donation Request
const deleteDonationRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const donationRequest = await DonationRequest.findById(id);

    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    // Only requester or admin can delete
    if (req.user.role !== 'admin' && donationRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own donation requests'
      });
    }

    await DonationRequest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Donation request deleted successfully'
    });
  } catch (error) {
    console.error('Delete donation request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting donation request',
      error: error.message
    });
  }
};

// Donate to Request (Change status to inprogress)
const donateToRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const donationRequest = await DonationRequest.findById(id);

    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    if (donationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This donation request is no longer available'
      });
    }

    // Cannot donate to your own request
    if (donationRequest.requester.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot donate to your own request'
      });
    }

    // Update donation request
    donationRequest.donor = req.user._id;
    donationRequest.status = 'inprogress';

    await donationRequest.save();

    const populatedRequest = await DonationRequest.findById(id)
      .populate('requester', 'name email avatar')
      .populate('donor', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Thank you for your donation!',
      donationRequest: populatedRequest
    });
  } catch (error) {
    console.error('Donate to request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing donation',
      error: error.message
    });
  }
};

module.exports = {
  createDonationRequest,
  getAllDonationRequests,
  getPublicDonationRequests,
  getDonationRequestById,
  updateDonationRequest,
  deleteDonationRequest,
  donateToRequest
};