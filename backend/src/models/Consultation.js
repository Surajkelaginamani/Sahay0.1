import mongoose from 'mongoose';

// Sub-schema for individual prescription line items
const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String, // e.g. "500mg"
      trim: true,
    },
    frequency: {
      type: String, // e.g. "Twice daily after meals"
      trim: true,
    },
    durationDays: {
      type: Number, // e.g. 5
    },
    instructions: {
      type: String, // e.g. "Avoid alcohol"
      trim: true,
    },
  },
  { _id: false }
);

// Sub-schema for investigation orders (lab tests, imaging, etc.)
const investigationOrderSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    // Where this order was routed: internal lab or external referral
    routedTo: {
      type: String,
      enum: ['LabHead', 'External', 'Radiology'],
      default: 'LabHead',
    },
    status: {
      type: String,
      enum: ['Ordered', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Ordered',
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const consultationSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
    },

    // Clinical notes
    chiefComplaints: {
      type: String,
      trim: true,
    },
    clinicalObservations: {
      type: String, // Vitals, physical exam findings
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },

    // ICD-10 code(s) for structured diagnosis
    icdCodes: [
      {
        code: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],

    // Digital prescription — array of medicine items
    prescription: [prescriptionItemSchema],

    // Investigation orders pushed to Lab/Radiology queues
    investigationOrders: [investigationOrderSchema],

    // Referral details if the doctor is handing off to another facility
    referral: {
      isReferred: { type: Boolean, default: false },
      referredTo: { type: String, trim: true }, // facility or specialist name
      referralNote: { type: String, trim: true },
      ashaNotified: { type: Boolean, default: false },
    },

    // Follow-up scheduling
    followUpDate: {
      type: Date,
    },

    // Doctor who authored this consultation
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Hospital where the consultation took place
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast patient timeline queries (via appointment lookup)
consultationSchema.index({ appointment: 1, createdAt: -1 });

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
