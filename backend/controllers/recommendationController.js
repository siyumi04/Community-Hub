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

// Related keywords for each community — used for smarter matching
const COMMUNITY_KEYWORDS = {
  cricket: ['cricket', 'batting', 'bowling', 'wicket', 'match', 'tournament', 'innings', 'umpire', 'pitch'],
  hockey: ['hockey', 'stick', 'goalkeeper', 'turf', 'penalty', 'dribble', 'field hockey'],
  environmental: ['environment', 'environmental', 'nature', 'hiking', 'trekking', 'cleanup', 'clean-up', 'recycle', 'sustainability', 'green', 'eco', 'tree', 'planting', 'conservation', 'wildlife', 'climate', 'beach', 'trail', 'outdoor', 'camping'],
  foc: ['foc', 'faculty', 'computing', 'tech', 'technology', 'hackathon', 'coding', 'programming', 'workshop', 'seminar', 'conference', 'talent'],
  food: ['food', 'cooking', 'culinary', 'recipe', 'baking', 'chef', 'cuisine', 'tasting', 'beverage', 'nutrition', 'kitchen', 'meal'],
}

const COMMUNITY_ID_BY_DASHBOARD = {
  'Cricket Club': 'cricket',
  'Hockey Club': 'hockey',
  'Environmental Community': 'environmental',
  'FOC Event Club': 'foc',
  'Food & Beverages Community': 'food',
}

const normalizeValue = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const resolveCommunityIdForAdmin = (admin = {}) => {
  if (admin.dashboardName && COMMUNITY_ID_BY_DASHBOARD[admin.dashboardName]) {
    return COMMUNITY_ID_BY_DASHBOARD[admin.dashboardName]
  }

  const candidates = [admin.dashboardName, admin.username, admin.email].filter(Boolean)
  for (const candidate of candidates) {
    const tokens = normalizeValue(candidate).split(/\s+/).filter(Boolean)
    if (tokens.includes('cricket')) return 'cricket'
    if (tokens.includes('hockey')) return 'hockey'
    if (tokens.includes('environmental')) return 'environmental'
    if (tokens.includes('foc')) return 'foc'
    if (tokens.includes('food')) return 'food'
  }

  return ''
}

const COMMUNITY_IDS = Object.keys(COMMUNITY_KEYWORDS)

const inferCommunitiesFromSkills = (skills = []) => {
  const normalizedSkills = skills.map((skill) => normalizeValue(skill)).filter(Boolean)
  const inferred = new Set()

  normalizedSkills.forEach((skill) => {
    COMMUNITY_IDS.forEach((communityId) => {
      const keywords = COMMUNITY_KEYWORDS[communityId] || []
      if (skill === communityId || keywords.some((kw) => normalizeValue(kw) === skill)) {
        inferred.add(communityId)
      }
    })
  })

  return Array.from(inferred)
}

const mergeAndRankRecommendations = (baseRecommendations, deterministicRecommendations) => {
  const byId = new Map()

  ;[...baseRecommendations, ...deterministicRecommendations].forEach((rec) => {
    const key = String(rec._id)
    const existing = byId.get(key)
    if (!existing || (rec.relevanceScore || 0) > (existing.relevanceScore || 0)) {
      byId.set(key, rec)
    }
  })

  return Array.from(byId.values()).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
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
    })
      .sort({ startDate: 1 })
      .populate('adminId', 'dashboardName username email')

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
    const skillDerivedCommunityIds = inferCommunitiesFromSkills(studentSkills)

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
      organizerCommunityId: resolveCommunityIdForAdmin(ev.adminId || {}),
      organizerDashboardName: ev.adminId?.dashboardName || '',
    }))

    // 4. Use AI to rank and recommend
    let recommendations = []

    if (process.env.GROQ_API_KEY && (studentSkills.length > 0 || joinedCommunities.length > 0)) {
      try {
        // Build community context for AI
        const communityContext = joinedCommunities.map((c) => {
          const keywords = COMMUNITY_KEYWORDS[c.communityId] || []
          return `${c.communityName} (related topics: ${keywords.join(', ')})`
        }).join('; ')

        const prompt = `You are an event recommendation engine for a university community hub.

A student has the following profile:
- Skills/Interests: ${studentSkills.join(', ')}
- Joined Communities: ${communityContext || 'None yet'}

Here are the upcoming events:
${eventSummaries.map((ev) => `[${ev.index}] "${ev.name}" - ${ev.description} (Category: ${ev.category}, Date: ${ev.date}, Location: ${ev.location})`).join('\n')}

IMPORTANT RULES:
- Provide recommendations ONLY if the event directly relates to the student's skills OR their joined communities.
- Consider the community's related topics. For example, if a student joined the Environmental Community, events about hiking, nature, trekking, cleanup, sustainability, camping ARE relevant.
- If a student joined the "Cricket Club", cricket events ARE relevant but hockey events are strictly NOT relevant.
- If an event organizerCommunityId matches one of the student's joined community IDs, treat it as a strong match.
- IF AN EVENT DOES NOT MATCH, YOU MUST EXCLUDE IT ENTIRELY from your JSON output. Do NOT include it with a low score.
- Minimum matching score should be 60. Do not return any event with a score below 60.

For each STRICT MATCHING event provide:
1. The event index number
2. A relevance score from 60 to 100
3. A short reason (max 20 words) explaining exactly how it matches their profile

Return ONLY a valid JSON array of the matched events, sorted by relevance (highest first):
[{"index":0,"score":95,"reason":"Matches your environmental community interests"}]`

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
              .filter((r) => r.index >= 0 && r.index < upcomingEvents.length && (r.score || 0) >= 60)
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
    // ONLY include events that actually match the student's skills or communities
    if (recommendations.length === 0 && (studentSkills.length > 0 || joinedCommunities.length > 0)) {
      const normalizedSkills = studentSkills.map((s) => s.toLowerCase())
      const communityIds = joinedCommunities.map((c) => c.communityId?.toLowerCase()).filter(Boolean)
      const communityNames = joinedCommunities.map((c) => c.communityName?.toLowerCase()).filter(Boolean)
      const effectiveCommunityIds = Array.from(new Set([...communityIds, ...skillDerivedCommunityIds]))

      const matched = []

      upcomingEvents.forEach((event) => {
        let score = 0
        const reasons = []

        // Check skill matches against event name + description
        const eventText = `${event.eventName} ${event.description} ${event.category}`.toLowerCase()
        const organizerCommunityId = resolveCommunityIdForAdmin(event.adminId || {})
        normalizedSkills.forEach((skill) => {
          if (eventText.includes(skill)) {
            score += 30
            reasons.push(skill)
          }
        })

        // Check community match (by ID, name, and related keywords)
        effectiveCommunityIds.forEach((cId) => {
          // Strong direct organizer-community match
          if (organizerCommunityId && organizerCommunityId === cId) {
            score += 45
            if (!reasons.includes(`${cId} club event`)) reasons.push(`${cId} club event`)
          }

          // Direct ID match
          if (eventText.includes(cId)) {
            score += 35
            reasons.push(cId)
          }
          // Related keywords match
          const relatedKeywords = COMMUNITY_KEYWORDS[cId] || []
          relatedKeywords.forEach((kw) => {
            if (eventText.includes(kw) && !reasons.includes(kw)) {
              score += 25
              reasons.push(kw)
            }
          })
        })
        communityNames.forEach((cName) => {
          if (eventText.includes(cName)) {
            score += 35
            if (!reasons.includes(cName)) reasons.push(cName)
          }
        })

        // ONLY include if there is at least one match (score > 0)
        if (score > 0) {
          matched.push({
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
            aiReason: `Matches your interests: ${reasons.slice(0, 3).join(', ')}`,
          })
        }
      })

      matched.sort((a, b) => b.relevanceScore - a.relevanceScore)
      recommendations = matched
    }

    // 6. Deterministic safety net:
    // If a student has a community-related skill (e.g. "cricket"),
    // always include upcoming events owned by that community admin.
    if (skillDerivedCommunityIds.length > 0) {
      const deterministicMatches = []
      const matchedSet = new Set(skillDerivedCommunityIds)

      upcomingEvents.forEach((event) => {
        const organizerCommunityId = resolveCommunityIdForAdmin(event.adminId || {})
        if (!organizerCommunityId || !matchedSet.has(organizerCommunityId)) return

        deterministicMatches.push({
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
          relevanceScore: 90,
          aiReason: `Matches your ${organizerCommunityId} skill`,
        })
      })

      recommendations = mergeAndRankRecommendations(recommendations, deterministicMatches)
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
