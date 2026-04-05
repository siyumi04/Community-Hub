import mongoose from 'mongoose'
import Member from '../models/Member.js'

const getAdminId = (req) => req.auth?.adminId || req.admin?.id || req.admin?._id

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

// Add new member
export const addMember = async (req, res) => {
  try {
    const {
      name,
      email,
      itNumber,
      mainType,
      category,
      role,
      notes,
    } = req.body
    const adminId = getAdminId(req)

    if (!name || !email || !itNumber || !mainType || !category || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, IT number, main type, category, and role are required',
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
      name,
      email,
      itNumber,
      mainType,
      category,
      sport: mainType === 'sport' ? category : undefined,
      notes,
      status: 'pending',
      role,
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

// Update basic member details (name, email, itNumber, mainType, category, role, notes)
export const updateMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const adminId = getAdminId(req)

    const allowedFields = ['name', 'email', 'itNumber', 'mainType', 'category', 'role', 'notes']
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

    // keep legacy sport in sync when mainType/category change
    if (updates.mainType && updates.category && updates.mainType === 'sport') {
      updates.sport = updates.category
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

    let csv = 'Name,Email,IT Number,Sport,Role,Joined Date\n'
    members.forEach((member) => {
      const joinDate = new Date(member.joinedDate).toLocaleDateString()
      csv += `"${member.name}","${member.email}","${member.itNumber}","${member.sport}","${member.role}","${joinDate}"\n`
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

    const stats = await Member.aggregate([
      { $match: { adminId: new mongoose.Types.ObjectId(adminId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          banned: { $sum: { $cond: [{ $eq: ['$status', 'banned'] }, 1, 0] } },
        },
      },
    ])

    res.status(200).json({
      success: true,
      data: stats[0] || { total: 0, approved: 0, pending: 0, rejected: 0, banned: 0 },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch member stats',
    })
  }
}
