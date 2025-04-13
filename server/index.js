const dotenv = require('dotenv');
if (process.env.NODE_ENV === 'development') {
  console.log('Using local environment variables');
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const summaryRoutes = require('./routes/summary');
const flashcardRoutes = require('./routes/flashcard');
const path = require('path');
// Initialize express app
const app = express();


// Connect to MongoDB
connectDB();

app.use(cors({
  origin: 'http://localhost:3000', // 
  credentials: true, // 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// middleware setup:
if (process.env.NODE_ENV === 'development') {
  console.log('Using local environment variables');
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

// Routes
// Static file serving - serve uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/flashcard', flashcardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5600;

app.listen(PORT, '0.0.0.0', () => {  // Explicitly bind to all network interfaces
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
