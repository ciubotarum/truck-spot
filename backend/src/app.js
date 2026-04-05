const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TruckSpot Backend',
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/locations', require('./routes/locations'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/parking', require('./routes/parking'));
app.use('/api/auth', require('./routes/auth'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

module.exports = app;
