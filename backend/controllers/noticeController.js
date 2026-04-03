import Notice from '../models/Notice.js'

// Create new notice
export const createNotice = async (req, res) => {
  try {
    const { title, content, category, priority, postedTo, expiryDate } = req.body
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id
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
    const adminId = req.admin?.id || req.admin?._id
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
    const adminId = req.admin?.id || req.admin?._id
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
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id

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
