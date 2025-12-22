// Change from just app.get('/') to:
app.all('/', (req, res) => {
  console.log('✅ Root route accessed via', req.method);
  res.json({
    success: true,
    message: 'API is running successfully!',
    timestamp: new Date().toISOString(),
    endpoint: req.url,
    method: req.method
  });
});

// Also add this catch-all route to debug:
app.all('*', (req, res, next) => {
  console.log(`📝 Request: ${req.method} ${req.originalUrl}`);
  next();
});