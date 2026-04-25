import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'
import { showPopup } from '../../../utils/popup'

function NoticeManagement({ onNoticeUpdated }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiryDate: '',
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/notices')
      const data = await response.json()
      if (response.ok && data.success) {
        setNotices(data.data)
      }
    } catch {
      showPopup('error', 'Error', 'Failed to fetch notices')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotice = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      showPopup('error', 'Validation', 'Please fill all required fields')
      return
    }

    try {
      const response = await apiFetch('/notices/create', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          expiryDate: formData.expiryDate || null,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        showPopup('success', 'Success', 'Notice posted successfully!')
        setFormData({
          title: '',
          content: '',
          expiryDate: '',
        })
        setShowCreateForm(false)
        await fetchNotices()
        if (typeof onNoticeUpdated === 'function') {
          onNoticeUpdated()
        }
      } else {
        showPopup('error', 'Error', data.message)
      }
    } catch {
      showPopup('error', 'Error', 'Failed to create notice')
    }
  }

  const handleArchiveNotice = async (noticeId) => {
    try {
      const response = await apiFetch(`/notices/${noticeId}/archive`, { method: 'PATCH' })
      if (response.ok) {
        showPopup('success', 'Success', 'Notice archived!')
        await fetchNotices()
        if (typeof onNoticeUpdated === 'function') {
          onNoticeUpdated()
        }
      }
    } catch {
      showPopup('error', 'Error', 'Failed to archive notice')
    }
  }

  return (
    <div className="notice-management">
      <div className="section-header">
        <h2>📢 Notice Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          ➕ Post Notice
        </button>
      </div>

      {/* Create Notice Form */}
      {showCreateForm && (
        <div className="form-card">
          <h3>Create New Notice</h3>
          <form onSubmit={handleCreateNotice}>
            <input
              type="text"
              placeholder="Notice Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Notice Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows="5"
              required
            />
            <input
              type="datetime-local"
              placeholder="Expiry Date (optional)"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Post Notice
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <p className="loading">Loading notices...</p>
      ) : notices.length > 0 ? (
        <div className="notices-list">
          {notices.map((notice) => (
            <div key={notice._id} className={`notice-card priority-${notice.priority.toLowerCase()}`}>
              <div className="notice-header">
                <div>
                  <h3>{notice.title}</h3>
                  <div className="notice-tags">
                    <span className={`badge badge-${notice.category.toLowerCase()}`}>{notice.category}</span>
                    <span className={`badge badge-priority-${notice.priority.toLowerCase()}`}>
                      {notice.priority}
                    </span>
                    {notice.isActive ? (
                      <span className="badge badge-active">Active</span>
                    ) : (
                      <span className="badge badge-inactive">Archived</span>
                    )}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleArchiveNotice(notice._id)}>
                  📁 Archive
                </button>
              </div>
              <p className="notice-body">{notice.content}</p>
              <div className="notice-footer">
                <p className="notice-posted-to">
                  📤 Posted to: {notice.postedTo.join(', ')}
                </p>
                <p className="notice-stats">
                  Views: {notice.views} | Posted: {new Date(notice.createdAt).toLocaleDateString()}
                  {notice.expiryDate && (
                    <>
                      {' '}
                      | Expires: {new Date(notice.expiryDate).toLocaleDateString()}
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">No notices found</p>
      )}
    </div>
  )
}

export default NoticeManagement
