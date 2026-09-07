import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    // Link to the User account for authentication
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Demographics
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    address: {
      village: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },

    // ABHA (Ayushman Bharat Health Account)
    abhaId: {
      type: String,
      unique: true,
      sparse: true, // allows null/undefined while enforcing uniqueness when set
      trim: true,
      match: [
        /^\d{2}-\d{4}-\d{4}-\d{4}$/,
        'ABHA ID must follow the format XX-XXXX-XXXX-XXXX',
      ],
    },
    abhaVerified: {
      type: Boolean,
      default: false,
    },

    // Emergency contact
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
