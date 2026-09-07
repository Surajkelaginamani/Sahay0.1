import mongoose from 'mongoose';

const diagnosticReportSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiagnosticOrder',
      required: [true, 'Order ID is required'],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    labHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lab Head ID is required'],
    },
    resultText: {
      type: String,
      trim: true,
      default: '',
    },
    fileUrl: {
      type: String,
      trim: true,
      default: '',
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'Verified'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'Pending',
    },
    completedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const DiagnosticReport = mongoose.model('DiagnosticReport', diagnosticReportSchema);

export default DiagnosticReport;
