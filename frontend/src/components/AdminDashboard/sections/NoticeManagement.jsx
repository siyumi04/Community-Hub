import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'
import { showPopup } from '../../../utils/popup'

function NoticeManagement({ admin }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    postedTo: ['Club Dashboard'],
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
    } catch (err) {
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
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        showPopup('success', 'Success', 'Notice posted successfully!')
        setFormData({
          title: '',
          content: '',
          category: 'General',
          priority: 'Medium',
          postedTo: ['Club Dashboard'],
          expiryDate: '',
        })
        setShowCreateForm(false)
        fetchNotices()
      } else {
        showPopup('error', 'Error', data.message)
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to create notice')
    }
  }

  const handleArchiveNotice = async (noticeId) => {
    try {
      const response = await apiFetch(`/notices/${noticeId}/archive`, { method: 'PATCH' })
      if (response.ok) {
        showPopup('success', 'Success', 'Notice archived!')
        fetchNotices()
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to archive notice')
    }
  }

  const categories = ['Announcement', 'Event', 'Urgent', 'General', 'Maintenance']
  const priorities = ['Low', 'Medium', 'High', 'Urgent']
  const postTargets = ['Club Dashboard', 'Member Team', 'Notice Board']

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
            <div className="form-row">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {priorities.map((pri) => (
                  <option key={pri} value={pri}>
                    {pri} Priority
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Post to:</label>
              <div className="checkboxes">
                {postTargets.map((target) => (
                  <label key={target} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.postedTo.includes(target)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            postedTo: [...formData.postedTo, target],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            postedTo: formData.postedTo.filter((t) => t !== target),
                          })
                        }
                      }}
                    />
                    {target}
                  </label>
                ))}
              </div>
            </div>
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
