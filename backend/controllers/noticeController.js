import Notice from '../models/Notice.js'
import Groq from 'groq-sdk';

let _groq;
function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// Create new notice
export const createNotice = async (req, res) => {
  try {
    const { title, content, category, priority, postedTo, expiryDate } = req.body
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization is required',
      })
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      })
    }

    const notice = new Notice({
      adminId,
      title,
      content,
      category: category || 'General',
      priority: priority || 'Medium',
      postedTo: postedTo || ['Club Dashboard'],
      expiryDate: expiryDate || null,
    })

    await notice.save()
    res.status(201).json({
      success: true,
      data: notice,
      message: 'Notice created successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create notice',
    })
  }
}

// Get all notices for admin
export const getNotices = async (req, res) => {
  try {
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization is required',
      })
    }
    const notices = await Notice.find({ adminId, isActive: true }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: notices,
      message: 'Notices retrieved successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch notices',
    })
  }
}

// Get active notices only
export const getActiveNotices = async (req, res) => {
  try {
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization is required',
      })
    }
    const now = new Date()

    const notices = await Notice.find({
      adminId,
      isActive: true,
      $or: [{ expiryDate: { $gt: now } }, { expiryDate: null }],
    }).sort({ priority: -1, createdAt: -1 })

    res.status(200).json({
      success: true,
      data: notices,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch active notices',
    })
  }
}

// Update notice
export const updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id
    const updates = req.body

    const notice = await Notice.findOneAndUpdate({ _id: noticeId, adminId }, updates, { new: true })

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      })
    }

    res.status(200).json({
      success: true,
      data: notice,
      message: 'Notice updated successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update notice',
    })
  }
}

// Archive/Delete notice
export const archiveNotice = async (req, res) => {
  try {
    const { noticeId } = req.params
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    const notice = await Notice.findOneAndUpdate({ _id: noticeId, adminId }, { isActive: false }, { new: true })

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      })
    }

    res.status(200).json({
      success: true,
      data: notice,
      message: 'Notice archived successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to archive notice',
    })
  }
}

// Increment notice views
export const incrementViews = async (req, res) => {
  try {
    const { noticeId } = req.params
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    const notice = await Notice.findOneAndUpdate(
      { _id: noticeId, adminId },
      { $inc: { views: 1 } },
      { new: true }
    )

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      })
    }

    res.status(200).json({
      success: true,
      data: notice,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update views',
    })
  }
}

/**
 * POST /api/notices/summarize
 * Body: { noticeText: string }
 * Returns: { summary: string }
 */
export const summarizeNotice = async (req, res) => {
  try {
    const { noticeText } = req.body;

    if (!noticeText || noticeText.trim().length === 0) {
      return res.status(400).json({ message: 'Notice text is required.' });
    }

    if (noticeText.trim().length < 20) {
      return res.status(400).json({ message: 'Notice text is too short to summarize.' });
    }

    const systemPrompt = `You are an AI assistant for a university community hub. Your job is to summarize long notices into clear, concise bullet points.

Rules:
- Extract and highlight ALL deadlines (dates, times) prominently
- Identify required actions students must take
- Keep bullet points short and actionable
- Use emoji icons for visual clarity: 📅 for dates, ⚠️ for urgent items, ✅ for required actions, 📌 for key info
- Start with a one-line summary of what the notice is about
- Group information logically: Summary → Deadlines → Required Actions → Additional Info
- If no deadlines are found, mention "No specific deadlines mentioned"
- Maximum 8 bullet points
- Use simple, student-friendly language`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please summarize the following notice:\n\n${noticeText}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 600,
    });

    const summary = chatCompletion.choices?.[0]?.message?.content;

    if (!summary) {
      return res.status(500).json({ message: 'Failed to generate summary.' });
    }

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Notice summarization error:', error);

    if (error?.status === 401) {
      return res.status(500).json({ message: 'Invalid Groq API key.' });
    }

    if (error?.status === 429) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please try again in a moment.' });
    }

    res.status(500).json({ message: 'Failed to summarize notice. Please try again.' });
  }
};
