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
    memberCount: {
        type: Number,
        default: 0
    },
    members: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        memberId: {
            type: String,
            unique: true
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
    timestamps: true
});

// Create the model from the schema
const Community = mongoose.model('Community', communitySchema);

export default Community;
