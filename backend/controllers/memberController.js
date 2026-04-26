import Member from '../models/Member.js'
import CommunityMember from '../models/CommunityMember.js'
import Admin from '../models/Admin.js'

const getAdminId = (req) => req.auth?.adminId || req.admin?.id || req.admin?._id

const VALID_YEAR_OF_STUDY = ['Year 1', 'Year 2', 'Year 3', 'Year 4']

const isValidPhone = (value) => /^\d{10}$/.test(String(value || '').trim())

const resolveCommunityIdFromAdmin = (admin = {}) => {
  const raw = [admin.dashboardName, admin.username, admin.email]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')

  if (raw.includes('cricket')) return 'cricket'
  if (raw.includes('hockey') || raw.includes('hokey')) return 'hockey'
  if (raw.includes('environmental') || raw.includes('enviromental')) return 'environmental'
  if (raw.includes('foc')) return 'foc'
  if (raw.includes('food')) return 'food'
  return ''
}

// Get all members for an admin
export const getMembers = async (req, res) => {
  try {
    const adminId = getAdminId(req)
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      })
    }

    const members = await Member.find({ adminId }).sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      data: members,
      message: 'Members retrieved successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch members',
    })
  }
}

// Get pending membership requests
export const getPendingRequests = async (req, res) => {
  try {
    const adminId = getAdminId(req)
    const pending = await Member.find({ adminId, status: 'pending' }).sort({ joinedDate: 1 })
    res.status(200).json({
      success: true,
      data: pending,
      message: 'Pending requests retrieved',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch pending requests',
    })
  }
}

// Add new member (phone + year of study only; no mainType/category/role)
export const addMember = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const {
      name,
      email,
      itNumber,
      phone,
      yearOfStudy,
      notes,
    } = body
    const adminId = getAdminId(req)

    const phoneDigits = String(phone || '').replace(/\D/g, '')
    const year = String(yearOfStudy || '').trim()

    if (!name || !email || !itNumber || !phoneDigits || !year) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide full name, email, IT number, a 10-digit phone number, and year of study (Year 1–4).',
      })
    }

    if (!isValidPhone(phoneDigits)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits',
      })
    }

    if (!VALID_YEAR_OF_STUDY.includes(year)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid year of study (Year 1–4)',
      })
    }

    const existingMember = await Member.findOne({ adminId, email })
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Member already exists',
      })
    }

    const member = new Member({
      adminId,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      itNumber: String(itNumber).trim().toUpperCase(),
      phone: phoneDigits,
      yearOfStudy: year,
      notes,
      status: 'pending',
      role: 'Member',
    })

    await member.save()
    res.status(201).json({
      success: true,
      data: member,
      message: 'Member added successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to add member',
    })
  }
}

// Update basic member details (name, email, itNumber, phone, yearOfStudy, notes)
export const updateMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const adminId = getAdminId(req)

    const allowedFields = ['name', 'email', 'itNumber', 'phone', 'yearOfStudy', 'notes']
    const updates = {}

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field]
      }
    })

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update',
      })
    }

    if (updates.email) {
      updates.email = String(updates.email).trim().toLowerCase()
    }
    if (updates.itNumber) {
      updates.itNumber = String(updates.itNumber).trim().toUpperCase()
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'phone')) {
      const digits = String(updates.phone || '').replace(/\D/g, '')
      if (!isValidPhone(digits)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits',
        })
      }
      updates.phone = digits
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'yearOfStudy')) {
      const y = String(updates.yearOfStudy || '').trim()
      if (!VALID_YEAR_OF_STUDY.includes(y)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid year of study (Year 1–4)',
        })
      }
      updates.yearOfStudy = y
    }

    const member = await Member.findOneAndUpdate(
      { _id: memberId, adminId },
      updates,
      { new: true },
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    res.status(200).json({
      success: true,
      data: member,
      message: 'Member updated successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update member',
    })
  }
}

// Approve membership request
export const approveMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const adminId = getAdminId(req)

    const member = await Member.findOneAndUpdate(
      { _id: memberId, adminId },
      { status: 'approved', approvedDate: new Date() },
      { new: true }
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    res.status(200).json({
      success: true,
      data: member,
      message: 'Member approved successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to approve member',
    })
  }
}

// Reject membership request
export const rejectMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const adminId = getAdminId(req)

    const member = await Member.findOneAndUpdate(
      { _id: memberId, adminId },
      { status: 'rejected' },
      { new: true }
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    res.status(200).json({
      success: true,
      data: member,
      message: 'Member rejected successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to reject member',
    })
  }
}

// Promote member to Event Team or Moderator
export const promoteMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const { role } = req.body
    const adminId = getAdminId(req)

    if (!['Event Team', 'Moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "Event Team" or "Moderator"',
      })
    }

    const member = await Member.findOneAndUpdate(
      { _id: memberId, adminId },
      { role },
      { new: true }
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    res.status(200).json({
      success: true,
      data: member,
      message: `Member promoted to ${role}`,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to promote member',
    })
  }
}

// Remove or ban member
export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const { action } = req.body // 'remove' or 'ban'
    const adminId = getAdminId(req)

    const status = action === 'ban' ? 'banned' : 'removed'
    const member = await Member.findOneAndUpdate(
      { _id: memberId, adminId },
      { status, removedDate: new Date() },
      { new: true }
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    const actionLabel = action === 'ban' ? 'banned' : 'removed'

    res.status(200).json({
      success: true,
      data: member,
      message: `Member ${actionLabel} successfully`,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to remove member',
    })
  }
}

// Export members as CSV
export const exportMembersCSV = async (req, res) => {
  try {
    const adminId = getAdminId(req)
    const members = await Member.find({ adminId, status: 'approved' })

    let csv = 'Name,Email,IT Number,Phone,Year of Study,Role,Joined Date\n'
    members.forEach((member) => {
      const joinDate = new Date(member.joinedDate).toLocaleDateString()
      csv += `"${member.name}","${member.email}","${member.itNumber}","${member.phone || ''}","${member.yearOfStudy || ''}","${member.role}","${joinDate}"\n`
    })

    res.header('Content-Type', 'text/csv')
    res.header('Content-Disposition', 'attachment; filename=members.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to export members',
    })
  }
}

// Get member statistics
export const getMemberStats = async (req, res) => {
  try {
    const adminId = getAdminId(req)
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      })
    }

    const admin = await Admin.findById(adminId).lean()
    const communityId = resolveCommunityIdFromAdmin(admin || {})

    if (!communityId) {
      return res.status(200).json({
        success: true,
        data: { total: 0, approved: 0, pending: 0, rejected: 0, banned: 0 },
      })
    }

    const [approved, pending, rejected] = await Promise.all([
      CommunityMember.countDocuments({ communityId, status: { $in: ['approved', 'active'] } }),
      CommunityMember.countDocuments({ communityId, status: 'pending' }),
      CommunityMember.countDocuments({ communityId, status: 'rejected' }),
    ])

    res.status(200).json({
      success: true,
      data: {
        total: approved,
        approved,
        pending,
        rejected,
        banned: 0,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch member stats',
    })
  }
}
