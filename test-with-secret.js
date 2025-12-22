require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('Testing JWT with .env secret...\n');

const secret = process.env.JWT_SECRET;

if (!secret || secret === 'your_very_strong_secret_key_here_make_it_long_and_random') {
  console.error('ERROR: JWT_SECRET is still the placeholder!');
  console.error('Please update your .env file with a real secret key.');
  process.exit(1);
}

console.log('JWT_SECRET found (length:', secret.length, 'characters)');

try {
  const payload = { userId: 'test123', role: 'admin', email: 'test@example.com' };

  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  console.log('Token created successfully');
  console.log('Token first 50 chars:', token.substring(0, 50) + '...');

  const decoded = jwt.verify(token, secret);
  console.log('Token verified successfully');
  console.log('Decoded userId:', decoded.userId);
  console.log('Decoded role:', decoded.role);
  
  console.log('\nJWT setup is complete and working!');
} catch (error) {
  console.error('JWT Error:', error.message);
  process.exit(1);
}