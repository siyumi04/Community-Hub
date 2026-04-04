import Community from '../models/Community.js';
import Student from '../models/Student.js';

// Utility function to generate member ID
const generateMemberId = (communityId, year, sequenceNumber) => {
    // Format: COMMUNITYABBR-YEAR-SEQUENCENUMBER
    // Example: CRI-2024-001 (Cricket Club, 2024 batch, 1st member)
    const abbreviations = {
        'cricket': 'CRI',
        'hockey': 'HOC',
        'environmental': 'ENV',
        'foc': 'FOC',
        'food': 'FOD'
    };
    
    const abbr = abbreviations[communityId] || communityId.substring(0, 3).toUpperCase();
    const sequence = String(sequenceNumber).padStart(3, '0');
    return `${abbr}-${year}-${sequence}`;
};

// Get all communities
export const getAllCommunities = async (req, res) => {
    try {
        const communities = await Community.find().select('-members');
        res.status(200).json({
            success: true,
            data: communities,
            message: 'Communities retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get community by ID
export const getCommunityById = async (req, res) => {
    try {
        const { communityId } = req.params;
        const community = await Community.findOne({ communityId });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }

        res.status(200).json({
            success: true,
            data: community,
            message: 'Community retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Join community
export const joinCommunity = async (req, res) => {
    try {
        const { 
            studentId, 
            communityId, 
            communityName, 
            fullName, 
            email, 
            phone, 
            year, 
            whyJoin,
            ...additionalFields 
        } = req.body;

        // Validation
        if (!studentId || !communityId || !communityName || !fullName || !email || !phone || !year) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if student already joined this community
        const alreadyJoined = student.joinedCommunities.some(
            comm => comm.communityId === communityId
        );

        if (alreadyJoined) {
            return res.status(400).json({
                success: false,
                message: 'Student is already a member of this community'
            });
        }

        // Get or create community
        let community = await Community.findOne({ communityId });
        if (!community) {
            community = new Community({
                communityId,
                name: communityName,
                description: '',
                tag: ''
            });
        }

        // Generate member ID
        const sequenceNumber = community.members.length + 1;
        const memberId = generateMemberId(communityId, year, sequenceNumber);

        // Add member to Community
        community.members.push({
            studentId,
            memberId,
            fullName,
            email,
            phone,
            year,
            whyJoin,
            additionalFields: new Map(Object.entries(additionalFields || {}))
        });

        community.memberCount = community.members.length;
        await community.save();

        // Add community to Student's joinedCommunities
        student.joinedCommunities.push({
            communityId,
            communityName,
            memberId,
            year,
            additionalInfo: new Map(Object.entries(additionalFields || {}))
        });

        await student.save();

        res.status(201).json({
            success: true,
            data: {
                memberId,
                communityId,
                communityName,
                studentId,
                year
            },
            message: 'Successfully joined community'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get community members
export const getCommunityMembers = async (req, res) => {
    try {
        const { communityId } = req.params;
        const community = await Community.findOne({ communityId }).populate('members.studentId', 'name email');

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }

        res.status(200).json({
            success: true,
            data: community.members,
            message: 'Community members retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Leave community
export const leaveCommunity = async (req, res) => {
    try {
        const { studentId, communityId } = req.params;

        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Find the member ID before removing
        const communityIndex = student.joinedCommunities.findIndex(
            comm => comm.communityId === communityId
        );

        if (communityIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Student is not a member of this community'
            });
        }

        const memberId = student.joinedCommunities[communityIndex].memberId;

        // Remove from Student
        student.joinedCommunities.splice(communityIndex, 1);
        await student.save();

        // Remove from Community
        const community = await Community.findOne({ communityId });
        if (community) {
            community.members = community.members.filter(
                member => member.memberId !== memberId
            );
            community.memberCount = community.members.length;
            await community.save();
        }

        res.status(200).json({
            success: true,
            message: 'Successfully left community'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
