import Community from '../models/Community.js';
import Student from '../models/Student.js';
import CommunityMember from '../models/CommunityMember.js';
import Admin from '../models/Admin.js';

// Utility function to generate member ID
const generateMemberId = (communityId, sequenceNumber) => {
    // Format: COMMUNITYABBR-CURRENTYEAR-SEQUENCENUMBER
    // Example: CRI-2026-001 (Cricket Club, joined in 2026, 1st member)
    const abbreviations = {
        'cricket': 'CRI',
        'hockey': 'HOC',
        'environmental': 'ENV',
        'foc': 'FOC',
        'food': 'FOD'
    };
    
    const abbr = abbreviations[communityId] || communityId.substring(0, 3).toUpperCase();
    const currentYear = new Date().getFullYear();
    const sequence = String(sequenceNumber).padStart(3, '0');
    return `${abbr}-${currentYear}-${sequence}`;
};

const COMMUNITY_NAME_BY_ID = {
    cricket: 'Cricket Club',
    hockey: 'Hockey Club',
    environmental: 'Environmental Community',
    foc: 'FOC Event Club',
    food: 'Food & Beverages Community'
};

const COMMUNITY_ID_BY_DASHBOARD = {
    'Cricket Club': 'cricket',
    'Hockey Club': 'hockey',
    'Environmental Community': 'environmental',
    'FOC Event Club': 'foc',
    'Food & Beverages Community': 'food'
};

const normalizeValue = (value = '') =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const DASHBOARD_ALIAS_TO_COMMUNITY_ID = {
    cricket: 'cricket',
    'cricket club': 'cricket',
    'cricket dashboard': 'cricket',
    hockey: 'hockey',
    'hockey club': 'hockey',
    'hockey dashboard': 'hockey',
    environmental: 'environmental',
    'environmental community': 'environmental',
    'environmental club': 'environmental',
    'environmental dashboard': 'environmental',
    foc: 'foc',
    'foc event club': 'foc',
    'foc club': 'foc',
    'foc dashboard': 'foc',
    food: 'food',
    'food community': 'food',
    'food and beverages community': 'food',
    'food beverages community': 'food',
    'food and beverage community': 'food',
    'food dashboard': 'food'
};

const resolveCommunityIdForAdmin = (admin) => {
    if (!admin) return '';

    // 1) Exact legacy mapping first (keeps previous behavior)
    if (admin.dashboardName && COMMUNITY_ID_BY_DASHBOARD[admin.dashboardName]) {
        return COMMUNITY_ID_BY_DASHBOARD[admin.dashboardName];
    }

    // 2) Normalize and match known aliases
    const candidates = [
        admin.dashboardName,
        admin.username,
        admin.email
    ].filter(Boolean);

    for (const candidate of candidates) {
        const normalized = normalizeValue(candidate);
        if (!normalized) continue;

        if (DASHBOARD_ALIAS_TO_COMMUNITY_ID[normalized]) {
            return DASHBOARD_ALIAS_TO_COMMUNITY_ID[normalized];
        }

        // Handle values like "cricket_admin_hub", "food-club-admin", etc.
        const tokens = normalized.split(/\s+/).filter(Boolean);
        if (tokens.includes('cricket')) return 'cricket';
        if (tokens.includes('hockey')) return 'hockey';
        if (tokens.includes('environmental')) return 'environmental';
        if (tokens.includes('foc')) return 'foc';
        if (tokens.includes('food')) return 'food';
    }

    return '';
};

const ACTIVE_MEMBER_STATUSES = ['approved', 'active'];

const getLiveCommunityMembers = async (communityId) => {
    const liveRequests = await CommunityMember.find({
        communityId,
        status: { $in: ACTIVE_MEMBER_STATUSES }
    }).sort({ createdAt: 1 });

    return liveRequests.map((request) => ({
        studentId: request.studentId,
        memberId: request.memberId,
        fullName: request.fullName,
        email: request.email,
        phone: request.phone,
        year: request.year,
        whyJoin: request.whyJoin || '',
        additionalFields: request.additionalFields || new Map(),
        joinedAt: request.joinedAt || request.reviewedAt || request.createdAt || new Date()
    }));
};

const syncCommunityMemberCache = async (communityDoc) => {
    const liveMembers = await getLiveCommunityMembers(communityDoc.communityId);
    const cachedMembers = Array.isArray(communityDoc.members) ? communityDoc.members : [];

    const cachedIds = cachedMembers.map((member) => String(member.memberId || '')).sort();
    const liveIds = liveMembers.map((member) => String(member.memberId || '')).sort();

    const isSameCache =
        cachedIds.length === liveIds.length &&
        cachedIds.every((memberId, index) => memberId === liveIds[index]);

    if (!isSameCache) {
        communityDoc.members = liveMembers;
        await communityDoc.save();
    }

    return liveMembers;
};

// Get all communities
export const getAllCommunities = async (req, res) => {
    try {
        const communities = await Community.find();
        const communitiesWithCounts = await Promise.all(
            communities.map(async (community) => {
                const liveMembers = await syncCommunityMemberCache(community);
                return {
                    ...community.toObject(),
                    members: liveMembers,
                    memberCount: liveMembers.length
                };
            })
        );

        res.status(200).json({
            success: true,
            data: communitiesWithCounts,
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

        const liveMembers = await syncCommunityMemberCache(community);

        res.status(200).json({
            success: true,
            data: {
                ...community.toObject(),
                members: liveMembers,
                memberCount: liveMembers.length
            },
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

        // Student already approved in profile
        const alreadyJoined = student.joinedCommunities.some((comm) => comm.communityId === communityId);
        if (alreadyJoined) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this community'
            });
        }

        const existingRequest = await CommunityMember.findOne({ studentId, communityId })
            .sort({ createdAt: -1 });

        if (existingRequest && (existingRequest.status === 'pending')) {
            return res.status(400).json({
                success: false,
                message: 'Your membership request is already pending approval'
            });
        }

        if (existingRequest && ['approved', 'active'].includes(existingRequest.status)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this community'
            });
        }

        let memberId = existingRequest?.memberId;
        if (!memberId) {
            const totalRequests = await CommunityMember.countDocuments({ communityId });
            memberId = generateMemberId(communityId, totalRequests + 1);
        }

        const requestPayload = {
            memberId,
            studentId,
            communityId,
            communityName: communityName || COMMUNITY_NAME_BY_ID[communityId] || communityId,
            fullName,
            studentNumber: req.body.studentNumber || '',
            email,
            phone,
            year,
            whyJoin: whyJoin || '',
            additionalFields: new Map(Object.entries(additionalFields || {})),
            status: 'pending',
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: ''
        };

        if (existingRequest && ['rejected', 'left'].includes(existingRequest.status)) {
            await CommunityMember.updateOne({ _id: existingRequest._id }, requestPayload);
        } else {
            await CommunityMember.create(requestPayload);
        }

        res.status(201).json({
            success: true,
            data: {
                memberId,
                communityId,
                communityName,
                studentId,
                year
            },
            message: 'Request submitted. Waiting for admin approval.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get student's current membership request status for one community
export const getMembershipRequestStatus = async (req, res) => {
    try {
        const { communityId, studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const isApprovedMember = student.joinedCommunities.some((comm) => comm.communityId === communityId);
        if (isApprovedMember) {
            return res.status(200).json({
                success: true,
                data: { status: 'approved' }
            });
        }

        const latestRequest = await CommunityMember.findOne({ communityId, studentId }).sort({ createdAt: -1 });
        if (!latestRequest) {
            return res.status(200).json({
                success: true,
                data: { status: 'none' }
            });
        }

        const normalizedStatus = latestRequest.status === 'active' ? 'approved' : latestRequest.status;

        return res.status(200).json({
            success: true,
            data: {
                status: normalizedStatus,
                requestId: String(latestRequest._id),
                reviewedAt: latestRequest.reviewedAt,
                rejectionReason: latestRequest.rejectionReason || ''
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Admin: list pending membership requests for admin's community
export const getAdminMembershipRequests = async (req, res) => {
    try {
        const adminId = req.auth?.adminId;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Admin authentication required'
            });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const communityId = resolveCommunityIdForAdmin(admin);
        if (!communityId) {
            return res.status(400).json({
                success: false,
                message: 'No community mapping found for this dashboard'
            });
        }

        const requests = await CommunityMember.find({ communityId, status: 'pending' })
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Admin: approve membership request
export const approveMembershipRequest = async (req, res) => {
    try {
        const adminId = req.auth?.adminId;
        const { requestId } = req.params;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Admin authentication required'
            });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const request = await CommunityMember.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Membership request not found'
            });
        }

        const adminCommunityId = resolveCommunityIdForAdmin(admin);
        if (!adminCommunityId || request.communityId !== adminCommunityId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to review this request'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending requests can be approved'
            });
        }

        const student = await Student.findById(request.studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const alreadyJoined = student.joinedCommunities.some((c) => c.communityId === request.communityId);
        if (!alreadyJoined) {
            student.joinedCommunities.push({
                communityId: request.communityId,
                communityName: request.communityName || COMMUNITY_NAME_BY_ID[request.communityId] || request.communityId,
                memberId: request.memberId,
                year: request.year,
                additionalInfo: request.additionalFields || new Map()
            });
            await student.save();
        }

        let community = await Community.findOne({ communityId: request.communityId });
        if (!community) {
            community = new Community({
                communityId: request.communityId,
                name: request.communityName || COMMUNITY_NAME_BY_ID[request.communityId] || request.communityId,
                description: '',
                tag: ''
            });
        }

        const existsInCommunity = community.members.some((m) => m.memberId === request.memberId);
        if (!existsInCommunity) {
            community.members.push({
                studentId: request.studentId,
                memberId: request.memberId,
                fullName: request.fullName,
                email: request.email,
                phone: request.phone,
                year: request.year,
                whyJoin: request.whyJoin,
                additionalFields: request.additionalFields || new Map(),
                joinedAt: new Date()
            });
            await community.save();
        }

        request.status = 'approved';
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        request.rejectionReason = '';
        request.joinedAt = new Date();
        await request.save();

        return res.status(200).json({
            success: true,
            data: request,
            message: 'Membership approved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Admin: reject membership request
export const rejectMembershipRequest = async (req, res) => {
    try {
        const adminId = req.auth?.adminId;
        const { requestId } = req.params;
        const { rejectionReason = '' } = req.body || {};

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Admin authentication required'
            });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const request = await CommunityMember.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Membership request not found'
            });
        }

        const adminCommunityId = resolveCommunityIdForAdmin(admin);
        if (!adminCommunityId || request.communityId !== adminCommunityId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to review this request'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending requests can be rejected'
            });
        }

        request.status = 'rejected';
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        request.rejectionReason = String(rejectionReason || '');
        await request.save();

        return res.status(200).json({
            success: true,
            data: request,
            message: 'Membership rejected successfully'
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
        const community = await Community.findOne({ communityId });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }

        const liveMembers = await syncCommunityMemberCache(community);

        res.status(200).json({
            success: true,
            data: liveMembers,
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
            await community.save();
        }

        // Mark as left in clubmembers collection
        await CommunityMember.findOneAndUpdate(
            { memberId },
            { status: 'left', leftAt: new Date() }
        );

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
