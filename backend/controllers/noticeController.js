import Groq from 'groq-sdk';

let _groq;
function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
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
