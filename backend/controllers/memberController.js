import Member from '../models/Member.js'

// Get all members for an admin
export const getMembers = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.admin?._id
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
    const adminId = req.admin?.id || req.admin?._id
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
    const { name, email, itNumber, notes } = req.body
    const adminId = req.admin?.id || req.admin?._id

    if (!name || !email || !itNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and IT number are required',
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
      notes,
      status: 'pending',
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

// Approve membership request
export const approveMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id

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

    res.status(200).json({
      success: true,
      data: member,
      message: `Member ${action}ned successfully`,
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
    const adminId = req.admin?.id || req.admin?._id
    const members = await Member.find({ adminId, status: 'approved' })

    let csv = 'Name,Email,IT Number,Role,Joined Date\n'
    members.forEach((member) => {
      const joinDate = new Date(member.joinedDate).toLocaleDateString()
      csv += `"${member.name}","${member.email}","${member.itNumber}","${member.role}","${joinDate}"\n`
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
    const adminId = req.admin?.id || req.admin?._id

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
