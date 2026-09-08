import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs';

// In ES Modules, local imports require the .js extension
import Hospital from './src/models/Hospital.js';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB Atlas (enforcing the 'sahay' database name)
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sahay' });
    console.log('Connected to MongoDB Atlas: sahay');

    // 2. Read the JSON file
    const rawData = fs.readFileSync('sahay_seed_data.json', 'utf-8');
    const data = JSON.parse(rawData);

    // 3. Clear existing test data to prevent duplicates
    console.log('Clearing old data...');
    await Hospital.deleteMany();
    await User.deleteMany();
    await Patient.deleteMany();

    // 4. Hash the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Sahay@2026', salt);

    // Dictionary to map the JSON 'H1', 'H2' references to real MongoDB ObjectIds
    const hospitalMap = {};

    // 5. Seed Hospitals
    console.log('Seeding Hospitals...');
    for (const h of data.hospitals) {
      const newHospital = await Hospital.create({
        hospitalName: h.hospitalName,
        registrationNumber: h.registrationNumber,
        address: h.address,
        contactPhone: h.contactPhone,
        verificationStatus: h.verificationStatus
      });
      // Store the real MongoDB _id so we can assign staff to it
      hospitalMap[h.hospitalId_ref] = newHospital._id;
    }

    // 6. Seed Staff
    console.log('Seeding Staff...');
    for (const s of data.staff) {
      await User.create({
        name: s.name,
        email: s.email,
        password: hashedPassword,
        role: s.role,
        hospitalId: hospitalMap[s.hospitalId_ref] // Link to the correct hospital
      });
    }

    // 7. Seed Patients
    console.log('Seeding Patients...');
    for (const p of data.patients) {
      const newUser = await User.create({
        name: p.name,
        email: p.email,
        password: hashedPassword,
        role: p.role
      });
      
      // Create the medical profile and link it to the User ID
      await Patient.create({
        _id: newUser._id,
        firstName: p.name.split(' ')[0],
        lastName: p.name.split(' ')[1] || '',
        contactPhone: p.phone,
        address: p.address,
        registeredAtFacility: hospitalMap["H1"] // Defaulting to the first hospital for testing
      });
    }

    console.log('✅ Real-time data seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();