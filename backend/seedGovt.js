import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './src/models/User.js';
import connectDB from './src/config/db.js';

const seedGovtEmployee = async () => {
  try {
    await connectDB();

    const email = 'admin@maharashtra.gov.in';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Government Employee account already exists.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // User model pre-save hook automatically handles bcrypt salt and hashing
    const govtUser = new User({
      name: 'State Health Admin',
      email: email,
      password: 'GovtSecure2026!',
      role: 'GovtEmployee',
    });

    await govtUser.save();
    console.log('Government Employee seeded successfully.');
    console.log(`Email: ${email}`);
    console.log('Password: GovtSecure2026!');
    console.log(`Role: ${govtUser.role}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Government Employee:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedGovtEmployee();