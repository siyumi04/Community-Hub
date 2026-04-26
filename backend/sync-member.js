import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CommunityMember from './models/CommunityMember.js';
import Member from './models/Member.js';
import Admin from './models/Admin.js';

dotenv.config();

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
    'cricket admin dashboard': 'cricket',
    'cricket club dashboard': 'cricket',
    'cricket community': 'cricket',
    hockey: 'hockey',
    hokey: 'hockey',
    'hockey club': 'hockey',
    'hokey club': 'hockey',
    'hockey dashboard': 'hockey',
    'hokey dashboard': 'hockey',
    'hockey admin dashboard': 'hockey',
    'hokey admin dashboard': 'hockey',
    'hockey club dashboard': 'hockey',
    'hokey club dashboard': 'hockey',
    'hockey community': 'hockey',
    'hokey community': 'hockey',
    environmental: 'environmental',
    'environmental community': 'environmental',
    'enviromental community': 'environmental',
    'environmental club': 'environmental',
    'enviromental club': 'environmental',
    'environmental dashboard': 'environmental',
    'enviromental dashboard': 'environmental',
    'environmental admin dashboard': 'environmental',
    'environmental club dashboard': 'environmental',
    'enviromental club dashboard': 'environmental',
    foc: 'foc',
    'foc event club': 'foc',
    'foc club': 'foc',
    'foc dashboard': 'foc',
    'foc admin dashboard': 'foc',
    'foc club dashboard': 'foc',
    'foc community': 'foc',
    food: 'food',
    'food community': 'food',
    'food and beverages community': 'food',
    'food beverages community': 'food',
    'food and beverage community': 'food',
    'food dashboard': 'food',
    'food admin dashboard': 'food',
    'food community dashboard': 'food',
    'food and beverages dashboard': 'food'
};

const resolveCommunityIdForAdmin = (admin) => {
    const candidates = [
        admin?.dashboardName,
        admin?.username,
        admin?.email
    ].filter(Boolean);

    for (const candidate of candidates) {
        const normalized = normalizeValue(candidate);
        if (!normalized) continue;
        if (DASHBOARD_ALIAS_TO_COMMUNITY_ID[normalized]) {
            return DASHBOARD_ALIAS_TO_COMMUNITY_ID[normalized];
        }
        const tokens = normalized.split(/\s+/).filter(Boolean);
        if (tokens.includes('cricket')) return 'cricket';
        if (tokens.includes('hockey') || tokens.includes('hokey')) return 'hockey';
        if (tokens.includes('environmental')) return 'environmental';
        if (tokens.includes('foc')) return 'foc';
        if (tokens.includes('food')) return 'food';
    }
    return '';
};

const syncMembers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
        console.log('Connected to MongoDB.');

        const admins = await Admin.find();
        
        for (const admin of admins) {
            const communityId = resolveCommunityIdForAdmin(admin);
            if (!communityId) continue;

            const approvedCommunityMembers = await CommunityMember.find({
                communityId,
                status: { $in: ['approved', 'active'] }
            });

            console.log(`Found ${approvedCommunityMembers.length} approved members for admin ${admin.email} (Community: ${communityId})`);

            for (const cm of approvedCommunityMembers) {
                const existing = await Member.findOne({ adminId: admin._id, email: cm.email });
                if (!existing) {
                    await Member.create({
                        adminId: admin._id,
                        studentId: cm.studentId,
                        name: cm.fullName,
                        email: cm.email,
                        itNumber: cm.studentNumber || '',
                        phone: cm.phone || '',
                        yearOfStudy: cm.year || '',
                        status: 'approved',
                        role: 'Member',
                        joinedDate: cm.joinedAt || new Date(),
                        approvedDate: cm.reviewedAt || new Date()
                    });
                    console.log(`Synced missing member: ${cm.email}`);
                } else {
                    console.log(`Member already exists: ${cm.email}`);
                }
            }
        }
        
        console.log('Sync complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

syncMembers();
