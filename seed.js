const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  avatar: String,
  bloodGroup: String,
  district: String,
  upazila: String,
  role: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const donationRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientName: String,
  recipientDistrict: String,
  recipientUpazila: String,
  hospitalName: String,
  fullAddress: String,
  bloodGroup: String,
  donationDate: Date,
  donationTime: String,
  requestMessage: String,
  status: String,
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const DonationRequest = mongoose.model('DonationRequest', donationRequestSchema);

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await DonationRequest.deleteMany({});
    console.log('Cleared existing data');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      avatar: 'https://i.ibb.co/4j3qY7Q/admin-avatar.png',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Mirpur',
      role: 'admin',
      status: 'active'
    });
    const volunteerPassword = await bcrypt.hash('volunteer123', 10);
    const volunteer = await User.create({
      name: 'Volunteer User',
      email: 'volunteer@example.com',
      password: volunteerPassword,
      avatar: 'https://i.ibb.co/4j3qY7Q/volunteer-avatar.png',
      bloodGroup: 'B+',
      district: 'Chittagong',
      upazila: 'Chandgaon',
      role: 'volunteer',
      status: 'active'
    });
    const donors = [];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const districts = ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet'];
    const upazilas = ['Mirpur', 'Uttara', 'Gulshan', 'Chandgaon', 'Kotwali', 'Khulna Sadar'];

    for (let i = 1; i <= 10; i++) {
      const password = await bcrypt.hash(`donor${i}123`, 10);
      const donor = await User.create({
        name: `Donor User ${i}`,
        email: `donor${i}@example.com`,
        password,
        avatar: `https://i.ibb.co/4j3qY7Q/donor${i}.png`,
        bloodGroup: bloodGroups[i % bloodGroups.length],
        district: districts[i % districts.length],
        upazila: upazilas[i % upazilas.length],
        role: 'donor',
        status: 'active'
      });
      donors.push(donor);
    }
    const donationRequests = [];
    const statuses = ['pending', 'inprogress', 'done', 'canceled'];
    const hospitals = [
      'Dhaka Medical College Hospital',
      'Chittagong Medical College Hospital',
      'Khulna Medical College Hospital',
      'Rajshahi Medical College Hospital',
      'Sylhet MAG Osmani Medical College Hospital'
    ];

    for (let i = 0; i < 15; i++) {
      const requester = donors[i % donors.length];
      const donor = i % 3 === 0 ? donors[(i + 1) % donors.length] : null;
      
      const request = await DonationRequest.create({
        requester: requester._id,
        recipientName: `Recipient ${i + 1}`,
        recipientDistrict: districts[i % districts.length],
        recipientUpazila: upazilas[i % upazilas.length],
        hospitalName: hospitals[i % hospitals.length],
        fullAddress: `Address line ${i + 1}, ${upazilas[i % upazilas.length]}, ${districts[i % districts.length]}`,
        bloodGroup: bloodGroups[i % bloodGroups.length],
        donationDate: new Date(Date.now() + i * 86400000),
        donationTime: `${10 + (i % 8)}:00 AM`,
        requestMessage: `Urgent need of blood for patient ${i + 1}. Please help if you can.`,
        status: statuses[i % statuses.length],
        donor: donor ? donor._id : null
      });
      donationRequests.push(request);
    }

    console.log('✅ Database seeded successfully!');
    console.log(`👥 Created ${1 + 1 + donors.length} users`);
    console.log(`🩸 Created ${donationRequests.length} donation requests`);
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Volunteer: volunteer@example.com / volunteer123');
    console.log('Donor 1: donor1@example.com / donor1123');
    console.log('Donor 2: donor2@example.com / donor2123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDatabase();