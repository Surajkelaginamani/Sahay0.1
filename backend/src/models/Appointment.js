import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    // ── Core References ───────────────────────────────────────────────────────
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Facility reference is required'],
    },
    receptionistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User with role='Receptionist'
      required: [true, 'Receptionist reference is required'],
    },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User with role='Doctor' — optional at booking time
      default: null,
    },

    // ── Scheduling ────────────────────────────────────────────────────────────
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String, // e.g. "09:00 AM – 09:30 AM"
      trim: true,
    },

    // ── Queue ─────────────────────────────────────────────────────────────────
    queueNumber: {
      type: Number,
      default: null,
    },

    // ── Workflow Status ───────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['Scheduled', 'CheckedIn', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid appointment status',
      },
      default: 'Scheduled',
    },

    // ── Visit Details ─────────────────────────────────────────────────────────
    visitType: {
      type: String,
      trim: true, // e.g. "General Checkup", "Follow-up", "Emergency"
    },
    chiefComplaint: {
      type: String,
      trim: true,
    },

    // ── Staff Notes ───────────────────────────────────────────────────────────
    staffNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound indexes ──────────────────────────────────────────────────────────
// Fast queue lookup: all appointments at a facility for a given day
appointmentSchema.index({ facilityId: 1, appointmentDate: 1, status: 1 });
// Fast doctor schedule lookup
appointmentSchema.index({ assignedDoctorId: 1, appointmentDate: 1 });
// Fast receptionist audit trail
appointmentSchema.index({ receptionistId: 1, createdAt: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
