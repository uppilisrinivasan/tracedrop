require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Donor data (served from data/synthetic until Firestore is wired in)
app.use('/api/donors', require('./routes/donors'));

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `No API route for ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`TraceDrop backend running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
