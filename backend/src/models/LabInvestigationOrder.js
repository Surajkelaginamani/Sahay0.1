import mongoose from 'mongoose';

/**
 * LabInvestigationOrder — the Lab Head's queue collection.
 *
 * Each document represents a single investigation test ordered by a doctor
 * during a consultation. When the Lab Head's dashboard queries their queue,
 * they filter by { hospital, status: 'Ordered' }.
 */
const labInvestigationOrderSchema = new mongoose.Schema(
  {
    // The consultation that generated this order
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      required: true,
    },

    // The patient the test is for
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    // The doctor who ordered the test
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The hospital where the test should be performed
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },

    // The test name e.g. "CBC", "Chest X-Ray", "Urine Culture"
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },

    // Routing: internal lab, radiology, or external facility
    routedTo: {
      type: String,
      enum: ['LabHead', 'External', 'Radiology'],
      default: 'LabHead',
    },

    // Workflow status tracked by the Lab Head
    status: {
      type: String,
      enum: {
        values: ['Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid investigation status',
      },
      default: 'Ordered',
    },

    // The Lab Head or technician who processed the order
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Date/time the sample was collected
    sampleCollectedAt: {
      type: Date,
      default: null,
    },

    // Date/time the result was reported
    resultReportedAt: {
      type: Date,
      default: null,
    },

    // Result summary or report URL
    resultSummary: {
      type: String,
      trim: true,
      default: null,
    },

    // Any special instructions from the ordering doctor
    clinicalNotes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common Lab Head queries
labInvestigationOrderSchema.index({ hospital: 1, status: 1, createdAt: -1 });
labInvestigationOrderSchema.index({ patient: 1, testName: 1, createdAt: -1 });
labInvestigationOrderSchema.index({ orderedBy: 1, createdAt: -1 });

const LabInvestigationOrder = mongoose.model(
  'LabInvestigationOrder',
  labInvestigationOrderSchema
);

export default LabInvestigationOrder;
