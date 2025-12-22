console.log('Testing JWT...');
try {
  const jwt = require('jsonwebtoken');
  console.log('jsonwebtoken module loaded successfully');
  
  const secret = 'test_secret';
  const payload = { userId: '123', role: 'donor' };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  
  console.log('Token created:', token);
  console.log('Token length:', token.length);
  
  const decoded = jwt.verify(token, secret);
  console.log('Token verified:', decoded);
  
  console.log('JWT is working correctly!');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Full error:', error);
}