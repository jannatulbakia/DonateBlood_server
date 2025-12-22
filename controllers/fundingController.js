const Funding = require('../models/Funding');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least 1'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString(),
        userName: req.user.name
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

// Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and amount are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Check if funding already exists
    const existingFunding = await Funding.findOne({ transactionId: paymentIntent.id });
    if (existingFunding) {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    // Create funding record
    const funding = new Funding({
      user: req.user._id,
      amount: amount,
      transactionId: paymentIntent.id,
      status: 'completed',
      paymentMethod: 'stripe'
    });

    await funding.save();

    // Populate user data
    const populatedFunding = await Funding.findById(funding._id)
      .populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully',
      funding: populatedFunding
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// Get All Fundings
const getAllFundings = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const query = { status: 'completed' };

    if (userId) query.user = userId;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'user',
        select: 'name email avatar'
      }
    };

    const fundings = await Funding.paginate(query, options);

    // Calculate total
    const totalFundings = await Funding.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      fundings,
      totalFunding: totalFundings[0]?.total || 0
    });
  } catch (error) {
    console.error('Get all fundings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting fundings',
      error: error.message
    });
  }
};

// Get Funding Statistics
const getFundingStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [daily, weekly, monthly, total] = await Promise.all([
      Funding.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfToday }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Funding.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfWeek }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Funding.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Funding.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      stats: {
        daily: daily[0]?.total || 0,
        weekly: weekly[0]?.total || 0,
        monthly: monthly[0]?.total || 0,
        total: total[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get funding stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting funding statistics',
      error: error.message
    });
  }
};

// Get user's fundings
const getUserFundings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      match: { user: req.user._id, status: 'completed' }
    };

    const fundings = await Funding.paginate({ user: req.user._id, status: 'completed' }, options);

    // Calculate user's total contribution
    const userTotal = await Funding.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      fundings,
      userTotal: userTotal[0]?.total || 0
    });
  } catch (error) {
    console.error('Get user fundings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user fundings',
      error: error.message
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getAllFundings,
  getFundingStats,
  getUserFundings
};