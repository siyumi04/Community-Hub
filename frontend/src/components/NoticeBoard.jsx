import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../utils/constants'

const NoticeBoard = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/notices/public`)
        const data = await response.json()

        if (response.ok && data.success) {
          setNotices(data.data)
        } else {
          setError(data.message || 'Failed to load notices')
        }
      } catch (err) {
        setError('Unable to connect to server')
      } finally {
        setLoading(false)
      }
    }

    fetchNotices()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Notices</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-indigo-300 text-sm animate-pulse">Loading notices...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Notices</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (notices.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Notices</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400 text-sm">No notices available at the moment.</div>
        </div>
      </div>
    )
  }

  // Map priority to color accents
  const priorityColors = {
    Urgent: 'linear-gradient(90deg, #ef4444, #f97316)',
    High: 'linear-gradient(90deg, #f59e0b, #ef4444)',
    Medium: 'linear-gradient(90deg, #6366f1, #a855f7)',
    Low: 'linear-gradient(90deg, #22d3ee, #6366f1)',
  }

  return (
    <div>
      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
        <h2 className="text-2xl font-bold text-white tracking-tight">Admin Notices</h2>
        <span className="ml-auto text-xs text-indigo-400 font-medium bg-indigo-500/10 px-3 py-1 rounded-full">
          {notices.length} {notices.length === 1 ? 'notice' : 'notices'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {notices.slice(0, 6).map((notice) => (
          <div
            key={notice._id}
            className="rounded-xl overflow-hidden border border-indigo-700/40 shadow-lg transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl"
            style={{ background: 'linear-gradient(160deg, #1e2660 0%, #2A265A 80%, #1a1a4a 100%)' }}
          >
            {/* Top accent stripe based on priority */}
            <div
              className="h-1 w-full"
              style={{ background: priorityColors[notice.priority] || priorityColors.Medium }}
            />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm text-indigo-200 uppercase tracking-wider">
                  {notice.title}
                </h3>
                {notice.priority === 'Urgent' && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold shrink-0">
                    ⚠ Urgent
                  </span>
                )}
                {notice.priority === 'High' && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold shrink-0">
                    High
                  </span>
                )}
              </div>
              {/* Divider */}
              <div className="w-10 h-px bg-indigo-400/40 mb-3" />
              <p className="text-slate-300 text-xs leading-relaxed">
                {notice.content}
              </p>
              {/* Date */}
              <p className="text-indigo-500 text-[10px] mt-3">
                {new Date(notice.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NoticeBoard
