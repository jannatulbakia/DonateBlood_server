const Joi = require('joi');

const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
    district: Joi.string().required(),
    upazila: Joi.string().required()
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

const donationRequestValidation = (data) => {
  const schema = Joi.object({
    recipientName: Joi.string().min(2).max(100).required(),
    recipientDistrict: Joi.string().required(),
    recipientUpazila: Joi.string().required(),
    hospitalName: Joi.string().min(2).max(200).required(),
    fullAddress: Joi.string().min(5).max(500).required(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
    donationDate: Joi.date().required(),
    donationTime: Joi.string().required(),
    requestMessage: Joi.string().min(10).max(1000).required()
  });

  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  donationRequestValidation
};