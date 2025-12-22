// api/index.js
const app = require('../index.js'); // Import your Express app

module.exports = (req, res) => {
  // Pass the request to Express
  app(req, res);
};