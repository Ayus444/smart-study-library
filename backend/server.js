const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/seats', require('./routes/seats'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ONE-TIME seed route — hit this URL once to create admin, then set SEED_ENABLED=false
app.get('/api/setup', async (req, res) => {
  if (process.env.SEED_ENABLED !== 'true') {
    return res.status(403).json({ message: 'Setup disabled. Set SEED_ENABLED=true in env vars to enable.' });
  }
  try {
    const User = require('./models/User');
    const Seat = require('./models/Seat');

    // Create admin if not exists
    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existing) {
      // Update password in case it changed
      existing.password = process.env.ADMIN_PASSWORD || 'admin123';
      await existing.save();
      return res.json({ success: true, message: '✅ Admin password updated. You can now login.' });
    }

    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@library.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });

    // Create 50 seats if none exist
    const seatCount = await Seat.countDocuments();
    if (seatCount === 0) {
      const seats = [];
      for (let i = 1; i <= 50; i++) {
        seats.push({ seatNumber: i, row: Math.ceil(i / 10), column: ((i - 1) % 10) + 1 });
      }
      await Seat.insertMany(seats);
    }

    res.json({
      success: true,
      message: '✅ Setup complete! Admin created + 50 seats initialized.',
      login: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-study-library')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
