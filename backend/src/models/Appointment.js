import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Doctor is a User with role='Doctor'
      required: [true, 'Doctor reference is required'],
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital reference is required'],
    },

    // Scheduled date & time slot
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String, // e.g. "09:00 AM - 09:30 AM"
      trim: true,
    },

    // Reason for visit
    chiefComplaint: {
      type: String,
      trim: true,
    },

    // Workflow status
    status: {
      type: String,
      enum: {
        values: ['Scheduled', 'Waiting', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
        message: '{VALUE} is not a valid appointment status',
      },
      default: 'Scheduled',
    },

    // Token number for physical queue management
    tokenNumber: {
      type: Number,
    },

    // Notes visible only to staff
    staffNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to efficiently query today's queue for a doctor at a specific hospital
appointmentSchema.index({ doctor: 1, hospital: 1, appointmentDate: 1, status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
