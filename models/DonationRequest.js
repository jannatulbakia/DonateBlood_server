const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const donationRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientName: {
    type: String,
    required: [true, 'Recipient name is required']
  },
  recipientDistrict: {
    type: String,
    required: [true, 'Recipient district is required']
  },
  recipientUpazila: {
    type: String,
    required: [true, 'Recipient upazila is required']
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required']
  },
  fullAddress: {
    type: String,
    required: [true, 'Full address is required']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  donationDate: {
    type: Date,
    required: [true, 'Donation date is required']
  },
  donationTime: {
    type: String,
    required: [true, 'Donation time is required']
  },
  requestMessage: {
    type: String,
    required: [true, 'Request message is required']
  },
  status: {
    type: String,
    enum: ['pending', 'inprogress', 'done', 'canceled'],
    default: 'pending'
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add pagination plugin
donationRequestSchema.plugin(paginate);

module.exports = mongoose.model('DonationRequest', donationRequestSchema);