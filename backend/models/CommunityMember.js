import mongoose from 'mongoose';

// This model maps to the existing 'clubmembers' collection in community_hub DB
const communityMemberSchema = new mongoose.Schema({
    memberId: {
        type: String,
        required: true
    },
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
    communityName: {
        type: String,
        required: true
    },
    // Form fields filled during join request
    fullName: {
        type: String,
        required: true
    },
    studentNumber: {
        type: String,  // e.g. IT21123456
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    whyJoin: {
        type: String,
        default: ''
    },
    // Community-specific additional fields (e.g. playingRole, cookingExperience)
    additionalFields: {
        type: Map,
        of: String,
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'left'],
        default: 'active'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'clubmembers'
});

const CommunityMember = mongoose.model('CommunityMember', communityMemberSchema);

export default CommunityMember;
