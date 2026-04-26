import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    itNumber: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    yearOfStudy: {
      type: String,
      default: '',
    },
    // Legacy field kept for backward compatibility, not required
    sport: {
      type: String,
    },
    mainType: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'banned'],
      default: 'pending',
    },
    role: {
      type: String,
      default: 'Member',
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    removedDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Member', memberSchema)
