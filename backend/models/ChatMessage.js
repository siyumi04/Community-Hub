import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    communityId: {
      type: String,
      required: true,
      enum: ['cricket', 'hockey', 'environmental', 'foc', 'food'],
    },
    message: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    senderRole: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    /** When the community admin has seen this message (only used for student → admin). */
    readAtAdmin: {
      type: Date,
      default: null,
    },
    /** When the student has seen this message (only used for admin → student). */
    readAtStudent: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'chatmessages',
  }
);

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
