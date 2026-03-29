// src/index.js
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './db/index.js';

// Load environment variables
dotenv.config({
  path: './.env',
});

const PORT = process.env.PORT || 8000;

// Connect to database then start server
connectDB()
  .then(() => {
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 IM Spinning Mills Backend Server`);
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🏢 Company: IM Spinning Mills (Pvt) Ltd`);
      console.log(`👥 Team: CodeMate\n`);
      console.log(`📚 API Documentation:`);
      console.log(`   Health: http://localhost:${PORT}/api/v1/health`);
      console.log(`   Auth: http://localhost:${PORT}/api/v1/auth`);
      console.log(`   Departments: http://localhost:${PORT}/api/v1/departments`);
      console.log(`   Staff: http://localhost:${PORT}/api/v1/staff`);
      console.log(`   Shifts: http://localhost:${PORT}/api/v1/shifts\n`);
    });

    // Handle server errors
    app.on('error', (error) => {
      console.error('❌ Server Error:', error);
      throw error;
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });