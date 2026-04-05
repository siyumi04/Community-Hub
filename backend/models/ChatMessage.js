import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    communityId: {
        type: String,
        required: true,
        enum: ['cricket', 'hockey', 'environmental', 'foc', 'food']
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    senderRole: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    }
}, {
    timestamps: true,
    collection: 'chatmessages'
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
