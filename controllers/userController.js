const User = require('../models/User');
const DonationRequest = require('../models/DonationRequest');
const Funding = require('../models/Funding');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting profile',
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bloodGroup, district, upazila } = req.body;
    const updateData = { name, bloodGroup, district, upazila };
    
    if (req.body.avatar) {
      updateData.avatar = req.body.avatar;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role } = req.query;
    const query = {};

    if (status) query.status = status;
    if (role) query.role = role;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-password',
      sort: { createdAt: -1 }
    };

    const users = await User.paginate(query, options);

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users',
      error: error.message
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${status === 'active' ? 'unblocked' : 'blocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['donor', 'volunteer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role value'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

const searchDonors = async (req, res) => {
  try {
    const { bloodGroup, district, upazila, page = 1, limit = 10 } = req.query;
    
    const query = { 
      status: 'active',
      role: { $in: ['donor', 'volunteer', 'admin'] }
    };

    if (bloodGroup && bloodGroup !== '') {
      query.bloodGroup = { $regex: new RegExp(`^${bloodGroup}$`, 'i') };
    }

    if (district && district !== '') {
      query.district = { $regex: new RegExp(`^${district}$`, 'i') };
    }

    if (upazila && upazila !== '') {
      query.upazila = { $regex: new RegExp(`^${upazila}$`, 'i') };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-password',
      sort: { createdAt: -1 }
    };
    
    const donors = await User.paginate(query, options);

    if (donors.docs.length === 0) {
      let alternativeResults = null;
      let message = 'No donors found matching all your criteria';
      
      if (bloodGroup && district) {
        const altQuery = {
          status: 'active',
          role: { $in: ['donor', 'volunteer', 'admin'] },
          bloodGroup: { $regex: new RegExp(`^${bloodGroup}$`, 'i') },
          district: { $regex: new RegExp(`^${district}$`, 'i') }
        };
        alternativeResults = await User.paginate(altQuery, options);
        
        if (alternativeResults.docs.length > 0) {
          message = `Found ${alternativeResults.docs.length} donor(s) in ${district} with blood group ${bloodGroup}`;
        }
      }
      
      if (!alternativeResults || alternativeResults.docs.length === 0) {
        if (bloodGroup) {
          const altQuery = {
            status: 'active',
            role: { $in: ['donor', 'volunteer', 'admin'] },
            bloodGroup: { $regex: new RegExp(`^${bloodGroup}$`, 'i') }
          };
          alternativeResults = await User.paginate(altQuery, options);
          
          if (alternativeResults.docs.length > 0) {
            message = `Found ${alternativeResults.docs.length} donor(s) with blood group ${bloodGroup}`;
          }
        }
      }
      
      if (!alternativeResults || alternativeResults.docs.length === 0) {
        if (district) {
          const altQuery = {
            status: 'active',
            role: { $in: ['donor', 'volunteer', 'admin'] },
            district: { $regex: new RegExp(`^${district}$`, 'i') }
          };
          if (upazila) {
            altQuery.upazila = { $regex: new RegExp(`^${upazila}$`, 'i') };
          }
          alternativeResults = await User.paginate(altQuery, options);
          
          if (alternativeResults.docs.length > 0) {
            message = `Found ${alternativeResults.docs.length} donor(s) in ${district}${upazila ? `, ${upazila}` : ''}`;
          }
        }
      }
      
      if (!alternativeResults || alternativeResults.docs.length === 0) {
        const altQuery = {
          status: 'active',
          role: { $in: ['donor', 'volunteer', 'admin'] }
        };
        alternativeResults = await User.paginate(altQuery, options);
        
        if (alternativeResults.docs.length > 0) {
          message = `Showing all ${alternativeResults.docs.length} active donor(s)`;
        }
      }

      if (alternativeResults && alternativeResults.docs.length > 0) {
        return res.status(200).json({
          success: true,
          donors: alternativeResults,
          message: message,
          originalSearch: { bloodGroup, district, upazila },
          searchType: 'alternative'
        });
      }
    }

    return res.status(200).json({
      success: true,
      donors,
      message: donors.docs.length > 0 
        ? `Found ${donors.docs.length} donor(s) matching all criteria`
        : 'No donors found',
      searchType: 'exact'
    });

  } catch (error) {
    console.error('Search donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching donors',
      error: error.message
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'donor' });
    const totalDonationRequests = await DonationRequest.countDocuments();
    
    const totalFundingResult = await Funding.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalFunding = totalFundingResult[0]?.total || 0;

    let recentDonations = [];
    if (req.user.role === 'donor') {
      recentDonations = await DonationRequest.find({ requester: req.user._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('donor', 'name email')
        .populate('requester', 'name email');
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalDonationRequests,
        totalFunding
      },
      recentDonations
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting dashboard statistics',
      error: error.message
    });
  }
};

const getBangladeshData = async (req, res) => {
  try {
    const { getDistricts, getUpazilasByDistrict } = require('../utils/bangladeshData');
    const districts = getDistricts();
    
    res.status(200).json({
      success: true,
      districts
    });
  } catch (error) {
    console.error('Get Bangladesh data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting Bangladesh data',
      error: error.message
    });
  }
};

const getUpazilas = async (req, res) => {
  try {
    const { district } = req.params;
    const { getUpazilasByDistrict } = require('../utils/bangladeshData');
    const upazilas = getUpazilasByDistrict(district);
    
    res.status(200).json({
      success: true,
      upazilas
    });
  } catch (error) {
    console.error('Get upazilas error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting upazilas',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  searchDonors,
  getDashboardStats,
  getBangladeshData,
  getUpazilas
};