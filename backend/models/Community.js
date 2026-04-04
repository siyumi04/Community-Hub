import mongoose from 'mongoose';

// Define the schema for a Community
const communitySchema = new mongoose.Schema({
    communityId: {
        type: String,
        required: true,
        unique: true,
        enum: ['cricket', 'hockey', 'environmental', 'foc', 'food']
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    tag: {
        type: String,
        default: ""
    },
    members: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        memberId: {
            type: String
        },
        fullName: String,
        email: String,
        phone: String,
        year: String,
        whyJoin: String,
        joinedAt: {
            type: Date,
            default: Date.now
        },
        additionalFields: {
            type: Map,
            of: String
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual property — memberCount is always computed from members.length (exact & real-time)
communitySchema.virtual('memberCount').get(function() {
    return this.members ? this.members.length : 0;
});

// Create the model from the schema
const Community = mongoose.model('Community', communitySchema);

export default Community;
