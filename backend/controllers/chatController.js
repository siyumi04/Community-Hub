import ChatMessage from '../models/ChatMessage.js';
import Student from '../models/Student.js';
import CommunityMember from '../models/CommunityMember.js';
import Groq from 'groq-sdk';

let _groq;
function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const ACTIVE_MEMBER_STATUSES = ['approved', 'active'];

async function isApprovedCommunityMember(studentId, communityId) {
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

async function canStudentAccessChat(studentId, communityId) {
  if (await isApprovedCommunityMember(studentId, communityId)) return true;
  return !!(await ChatMessage.exists({ studentId, communityId }));
}

// AI Toxicity Check using Groq
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
    // If parsing fails, be safe and allow
  }

  return { toxic: false, reason: '' };
};

// Send a message (student → admin)
export const sendMessage = async (req, res) => {
  try {
    const { communityId, message } = req.body;
    const studentId = req.auth?.studentId;

    if (!studentId || !communityId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    if (trimmed.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be 1000 characters or fewer',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const allowed = await isApprovedCommunityMember(studentId, communityId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'You must be an approved member of this community to send messages',
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
      senderRole: 'student',
      readAtAdmin: null,
      readAtStudent: null,
    });

    res.status(201).json({
      success: true,
      data: chatMessage,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Chat sendMessage error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get chat messages for a student in a community (marks admin → student messages as read)
export const getMessages = async (req, res) => {
  try {
    const { communityId } = req.params;
    const studentId = req.auth?.studentId;

    if (!studentId || !communityId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const allowed = await isApprovedCommunityMember(studentId, communityId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'You must be an approved member of this community to view messages',
      });
    }

    await ChatMessage.updateMany(
      {
        studentId,
        communityId,
        senderRole: 'admin',
        readAtStudent: null,
        isDeleted: { $ne: true },
      },
      { $set: { readAtStudent: new Date() } }
    );

    const messages = await ChatMessage.find({
      studentId,
      communityId,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
      message: 'Messages retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Unread count for student (messages from admin not yet read)
export const getStudentUnreadCount = async (req, res) => {
  try {
    const { communityId } = req.params;
    const studentId = req.auth?.studentId;

    if (!studentId || !communityId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const allowed = await canStudentAccessChat(studentId, communityId);
    if (!allowed) {
      return res.status(200).json({ success: true, data: { count: 0 } });
    }

    const count = await ChatMessage.countDocuments({
      studentId,
      communityId,
      senderRole: { $ne: 'student' },
      readAtStudent: null,
      isDeleted: { $ne: true },
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Soft-delete own student message
export const deleteStudentMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const studentId = req.auth?.studentId;

    if (!studentId || !messageId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const doc = await ChatMessage.findById(messageId);
    if (!doc || String(doc.studentId) !== String(studentId)) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (doc.senderRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
      });
    }

    if (doc.isDeleted) {
      return res.status(200).json({
        success: true,
        data: doc,
        message: 'Message already deleted',
      });
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
