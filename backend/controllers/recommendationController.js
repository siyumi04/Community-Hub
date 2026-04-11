import Event from '../models/Event.js'
import Student from '../models/Student.js'
import Groq from 'groq-sdk'

let groqClient
const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

/**
 * GET /api/recommendations/:studentId
 * AI-powered event recommendations based on student skills + joined communities.
 *
 * Flow:
 * 1. Fetch student profile (skills + joinedCommunities)
 * 2. Fetch all upcoming events from DB
 * 3. Send student profile + events to Groq AI for intelligent ranking
 * 4. Return ranked recommendations with AI-generated reasons
 */
export const getRecommendedEvents = async (req, res) => {
  try {
    const { studentId } = req.params

    // 1. Fetch student profile
    const student = await Student.findById(studentId).select('-password')
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      })
    }

    // 2. Fetch all upcoming events
    const upcomingEvents = await Event.find({
      eventStatus: 'upcoming',
      startDate: { $gte: new Date() },
    }).sort({ startDate: 1 })

    if (upcomingEvents.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No upcoming events available',
      })
    }

    // 3. Prepare student context
    const studentSkills = student.skills || []
    const joinedCommunities = (student.joinedCommunities || []).map((c) => ({
      communityId: c.communityId,
      communityName: c.communityName,
    }))

    // Build event summaries for AI
    const eventSummaries = upcomingEvents.map((ev, idx) => ({
      index: idx,
      id: ev._id.toString(),
      name: ev.eventName,
      description: ev.description,
      category: ev.category,
      date: ev.startDate.toISOString().split('T')[0],
      location: ev.location,
      venue: ev.venue,
    }))

    // 4. Use AI to rank and recommend
    let recommendations = []

    if (process.env.GROQ_API_KEY && studentSkills.length > 0) {
      try {
        const prompt = `You are an AI event recommendation engine for a university community hub.

A student has the following profile:
- Skills/Interests: ${studentSkills.join(', ')}
- Joined Communities: ${joinedCommunities.length > 0 ? joinedCommunities.map((c) => c.communityName).join(', ') : 'None yet'}

Here are the upcoming events:
${eventSummaries.map((ev) => `[${ev.index}] "${ev.name}" - ${ev.description} (Category: ${ev.category}, Date: ${ev.date}, Location: ${ev.location})`).join('\n')}

Rank ALL events by relevance to this student's skills and community interests. For each event, provide:
1. The event index number
2. A relevance score from 0 to 100
3. A short reason (max 20 words) explaining why this event matches the student

Return ONLY valid JSON array, sorted by relevance (highest first):
[{"index":0,"score":95,"reason":"Matches your cricket skills perfectly"}]`

        const completion = await getGroqClient().chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = completion.choices?.[0]?.message?.content
        if (raw) {
          const cleaned = raw
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```$/, '')
            .trim()
          const parsed = JSON.parse(cleaned)

          if (Array.isArray(parsed)) {
            recommendations = parsed
              .filter((r) => r.index >= 0 && r.index < upcomingEvents.length)
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((r) => {
                const event = upcomingEvents[r.index]
                return {
                  _id: event._id,
                  eventName: event.eventName,
                  description: event.description,
                  category: event.category,
                  startDate: event.startDate,
                  endDate: event.endDate,
                  location: event.location,
                  venue: event.venue,
                  eventPost: event.eventPost,
                  eventStatus: event.eventStatus,
                  maxCapacity: event.maxCapacity,
                  registeredMembers: event.registeredMembers,
                  relevanceScore: r.score || 0,
                  aiReason: r.reason || 'Recommended for you',
                }
              })
          }
        }
      } catch (aiError) {
        console.error('AI recommendation error, falling back to keyword matching:', aiError.message)
      }
    }

    // 5. Fallback: keyword-based matching if AI fails or no API key
    if (recommendations.length === 0) {
      const normalizedSkills = studentSkills.map((s) => s.toLowerCase())
      const communityIds = joinedCommunities.map((c) => c.communityId?.toLowerCase())

      recommendations = upcomingEvents.map((event) => {
        let score = 0
        const reasons = []

        // Check skill matches against event name + description
        const eventText = `${event.eventName} ${event.description} ${event.category}`.toLowerCase()
        normalizedSkills.forEach((skill) => {
          if (eventText.includes(skill)) {
            score += 25
            reasons.push(skill)
          }
        })

        // Check community match
        communityIds.forEach((cId) => {
          if (eventText.includes(cId)) {
            score += 30
          }
        })

        // Base score for upcoming events
        score += 10

        const reason =
          reasons.length > 0
            ? `Matches your interests: ${reasons.slice(0, 3).join(', ')}`
            : 'Upcoming event you might enjoy'

        return {
          _id: event._id,
          eventName: event.eventName,
          description: event.description,
          category: event.category,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          venue: event.venue,
          eventPost: event.eventPost,
          eventStatus: event.eventStatus,
          maxCapacity: event.maxCapacity,
          registeredMembers: event.registeredMembers,
          relevanceScore: Math.min(score, 100),
          aiReason: reason,
        }
      })

      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    return res.status(200).json({
      success: true,
      data: recommendations,
      studentSkills,
      joinedCommunities: joinedCommunities.map((c) => c.communityName),
      message: `Found ${recommendations.length} recommended events`,
    })
  } catch (error) {
    console.error('Recommendation error:', error.message)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations',
    })
  }
}
