import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Sports', 'Cultural', 'Academic', 'Social', 'Technical', 'Competition', 'Workshop', 'Other'],
      default: 'Other',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
    },
    registeredMembers: {
      type: Number,
      default: 0,
    },
    attendanceCount: {
      type: Number,
      default: 0,
    },
    registeredList: [
      {
        memberId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Member',
        },
        name: String,
        qrCode: String,
        attended: {
          type: Boolean,
          default: false,
        },
      },
    ],
    eventStatus: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    qrCode: {
      type: String, // URL to QR code image
    },
    feedbackCollected: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Event', eventSchema)
