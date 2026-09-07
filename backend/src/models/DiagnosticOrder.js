import mongoose from 'mongoose';

const diagnosticOrderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Facility ID is required'],
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Ordered', 'SampleCollected', 'Processing', 'Completed'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'Ordered',
    },
  },
  {
    timestamps: true,
  }
);

const DiagnosticOrder = mongoose.model('DiagnosticOrder', diagnosticOrderSchema);

export default DiagnosticOrder;
