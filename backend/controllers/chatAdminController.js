import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage.js';
import Student from '../models/Student.js';
import Admin from '../models/Admin.js';
import CommunityMember from '../models/CommunityMember.js';
import Groq from 'groq-sdk';
import {
  resolveCommunityIdFromAdmin as resolveAdminCommunityId,
  fromMemberSenderFilter,
} from '../utils/adminCommunityId.js';

const ACTIVE_MEMBER_STATUSES = ['approved', 'active'];

const getAdminId = (req) => req.auth?.adminId || req.admin?.id || req.admin?._id;

let _groq;
function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const checkToxicity = async (message) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const systemPrompt = `You are a strict content moderation AI. Your ONLY job is to check if a message contains toxic, offensive, abusive, hateful, racist, sexist, threatening, sexually explicit, or vulgar/filthy language in English.

Rules:
- Respond with ONLY a valid JSON object, nothing else.
- Format: {"toxic": true/false, "reason": "brief reason or empty string"}
- If the message is clean, respond: {"toxic": false, "reason": ""}
- If the message contains ANY toxic, offensive, filthy, abusive, hateful, discriminatory, threatening, or sexually explicit content, respond: {"toxic": true, "reason": "brief description of why"}
- Be strict: even mild slurs, disguised profanity, or coded hate speech should be flagged.
- Do NOT flag normal conversation, criticism, or negative opinions as toxic.`;

  const completion = await getGroq().chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Check this message for toxicity:\n\n"${message}"` },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 150,
  });

  const raw = completion.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // allow if parse fails
  }

  return { toxic: false, reason: '' };
};

async function loadAdminCommunity(req) {
  const adminId = getAdminId(req);
  if (!adminId) {
    return { error: { status: 401, message: 'Admin authentication required' } };
  }
  const admin = await Admin.findById(adminId).lean();
  if (!admin) {
    return { error: { status: 404, message: 'Admin not found' } };
  }
  const communityId = resolveAdminCommunityId(admin);
  if (!communityId) {
    return { error: { status: 400, message: 'Could not resolve community for this admin account' } };
  }
  return { adminId, admin, communityId };
}

async function isApprovedMember(studentId, communityId) {
  const m = await CommunityMember.findOne({
    studentId,
    communityId,
    status: { $in: ACTIVE_MEMBER_STATUSES },
  }).lean();
  if (m) return true;
  const student = await Student.findById(studentId).select('joinedCommunities').lean();
  if (!student?.joinedCommunities?.length) return false;
  return student.joinedCommunities.some((c) => c.communityId === communityId);
}

/** Member record or existing thread (handles sync gaps vs CommunityMember). */
async function canAdminAccessStudentThread(studentId, communityId) {
  if (await isApprovedMember(studentId, communityId)) return true;
  return !!(await ChatMessage.exists({ studentId, communityId }));
}

/** Total unread (student → admin) for this admin's community */
export const getAdminUnreadTotal = async (req, res) => {
  try {
    const ctx = await loadAdminCommunity(req);
    if (ctx.error) {
      return res.status(ctx.error.status).json({ success: false, message: ctx.error.message });
    }
    const { communityId } = ctx;

    const count = await ChatMessage.countDocuments({
      communityId,
      ...fromMemberSenderFilter(),
      readAtAdmin: null,
      isDeleted: { $ne: true },
    });

    res.status(200).json({
      success: true,
      data: { count, communityId },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** One row per student who has ever messaged this community */
export const getAdminConversations = async (req, res) => {
  try {
    const ctx = await loadAdminCommunity(req);
    if (ctx.error) {
      return res.status(ctx.error.status).json({ success: false, message: ctx.error.message });
    }
    const { communityId } = ctx;

    const studentIds = await ChatMessage.distinct('studentId', { communityId });

    const rows = await Promise.all(
      studentIds.map(async (sid) => {
        const [last, unread, student] = await Promise.all([
          ChatMessage.findOne({ communityId, studentId: sid }).sort({ createdAt: -1 }).lean(),
          ChatMessage.countDocuments({
            communityId,
            studentId: sid,
            ...fromMemberSenderFilter(),
            readAtAdmin: null,
            isDeleted: { $ne: true },
          }),
          Student.findById(sid).select('name itNumber email').lean(),
        ]);

        const preview = last?.isDeleted
          ? 'This message was deleted.'
          : (last?.message || '').slice(0, 100);

        return {
          studentId: String(sid),
          name: student?.name || 'Member',
          itNumber: student?.itNumber || '',
          email: student?.email || '',
          unreadCount: unread,
          lastMessageAt: last?.createdAt || null,
          lastMessagePreview: preview,
          lastSenderRole: last?.senderRole || null,
        };
      })
    );

    rows.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

    res.status(200).json({
      success: true,
      data: rows,
      communityId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Full thread + mark student messages as read by admin */
export const getAdminThread = async (req, res) => {
  try {
    const ctx = await loadAdminCommunity(req);
    if (ctx.error) {
      return res.status(ctx.error.status).json({ success: false, message: ctx.error.message });
    }
    const { communityId } = ctx;
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student id is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }

    const accessOk = await canAdminAccessStudentThread(studentId, communityId);
    if (!accessOk) {
      return res.status(403).json({
        success: false,
        message: 'This student is not an active member of your community',
      });
    }

    await ChatMessage.updateMany(
      {
        communityId,
        studentId,
        ...fromMemberSenderFilter(),
        readAtAdmin: null,
        isDeleted: { $ne: true },
      },
      { $set: { readAtAdmin: new Date() } }
    );

    const student = await Student.findById(studentId).select('name itNumber email').lean();

    const messages = await ChatMessage.find({ communityId, studentId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        messages,
        student: {
          _id: studentId,
          name: student?.name || 'Member',
          itNumber: student?.itNumber || '',
          email: student?.email || '',
        },
        communityId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Admin → student message */
export const sendAdminMessage = async (req, res) => {
  try {
    const ctx = await loadAdminCommunity(req);
    if (ctx.error) {
      return res.status(ctx.error.status).json({ success: false, message: ctx.error.message });
    }
    const { communityId } = ctx;

    const { studentId, message } = req.body;
    if (!studentId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Student id and message are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }

    const accessOk = await canAdminAccessStudentThread(studentId, communityId);
    if (!accessOk) {
      return res.status(403).json({
        success: false,
        message: 'This student is not an active member of your community',
      });
    }

    const trimmed = String(message).trim();
    if (!trimmed.length) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be 1000 characters or fewer',
      });
    }

    const toxicityResult = await checkToxicity(trimmed);
    if (toxicityResult.toxic) {
      return res.status(400).json({
        success: false,
        toxic: true,
        message: `Your message was blocked by our AI content filter. Reason: ${toxicityResult.reason || 'Offensive or inappropriate content detected.'}`,
      });
    }

    const chatMessage = await ChatMessage.create({
      studentId,
      communityId,
      message: trimmed,
      senderRole: 'admin',
      readAtAdmin: new Date(),
      readAtStudent: null,
    });

    res.status(201).json({
      success: true,
      data: chatMessage,
      message: 'Message sent successfully',
    });
  } catch (err) {
    console.error('sendAdminMessage:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Soft-delete any message in this community thread (admin moderation) */
export const deleteAdminMessage = async (req, res) => {
  try {
    const ctx = await loadAdminCommunity(req);
    if (ctx.error) {
      return res.status(ctx.error.status).json({ success: false, message: ctx.error.message });
    }
    const { communityId } = ctx;
    const { messageId } = req.params;

    const doc = await ChatMessage.findById(messageId);
    if (!doc || doc.communityId !== communityId) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (doc.isDeleted) {
      return res.status(200).json({ success: true, data: doc, message: 'Message already deleted' });
    }

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    doc.message = '';
    await doc.save();

    res.status(200).json({
      success: true,
      data: doc,
      message: 'Message deleted',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
