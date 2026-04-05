import ChatMessage from '../models/ChatMessage.js';
import Student from '../models/Student.js';
import Groq from 'groq-sdk';

let _groq;
function getGroq() {
    if (!_groq) {
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return _groq;
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
            { role: 'user', content: `Check this message for toxicity:\n\n"${message}"` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 150,
    });

    const raw = completion.choices?.[0]?.message?.content || '';

    try {
        // Extract JSON from the response
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
                message: 'Missing required fields'
            });
        }

        // Trim and validate length
        const trimmed = message.trim();
        if (trimmed.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message cannot be empty'
            });
        }

        if (trimmed.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Message must be 1000 characters or fewer'
            });
        }

        // Verify student is a member of this community
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const isMember = student.joinedCommunities.some(
            c => c.communityId === communityId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: 'You must be a member of this community to send messages'
            });
        }

        // AI Toxicity Check
        const toxicityResult = await checkToxicity(trimmed);

        if (toxicityResult.toxic) {
            return res.status(400).json({
                success: false,
                toxic: true,
                message: `Your message was blocked by our AI content filter. Reason: ${toxicityResult.reason || 'Offensive or inappropriate content detected.'}`,
            });
        }

        // Message is clean — save to DB
        const chatMessage = await ChatMessage.create({
            studentId,
            communityId,
            message: trimmed,
            senderRole: 'student'
        });

        res.status(201).json({
            success: true,
            data: chatMessage,
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Chat sendMessage error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get chat messages for a student in a community
export const getMessages = async (req, res) => {
    try {
        const { communityId } = req.params;
        const studentId = req.auth?.studentId;

        if (!studentId || !communityId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const messages = await ChatMessage.find({
            studentId,
            communityId
        }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: messages,
            message: 'Messages retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
