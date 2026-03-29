// src/db/index.js
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`\n✅ MongoDB Connected Successfully!`);
    console.log(`📦 Database Host: ${connectionInstance.connection.host}`);
    console.log(`🏢 Database Name: ${connectionInstance.connection.name}`);
    console.log(`🎯 Ready for IM Spinning Mills Operations!\n`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;