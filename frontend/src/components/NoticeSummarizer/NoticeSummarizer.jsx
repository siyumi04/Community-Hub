import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '../../services/apiClient'
import { API_BASE_URL } from '../../utils/constants'
import './NoticeSummarizer.css'

// Priority config for badge colors
const PRIORITY_CONFIG = {
  Urgent: { label: '⚠ Urgent', className: 'priority-urgent' },
  High: { label: 'High', className: 'priority-high' },
  Medium: { label: 'Medium', className: 'priority-medium' },
  Low: { label: 'Low', className: 'priority-low' },
}

// Category emoji map
const CATEGORY_EMOJI = {
  Announcement: '📢',
  Event: '🎉',
  Urgent: '🚨',
  General: '📋',
  Maintenance: '🔧',
}

function NoticeSummarizer() {
  const [noticeText, setNoticeText] = useState('')
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef(null)

  // Live notices state
  const [notices, setNotices] = useState([])
  const [noticesLoading, setNoticesLoading] = useState(true)
  const [noticesError, setNoticesError] = useState('')
  const [selectedNoticeId, setSelectedNoticeId] = useState(null)

  // Fetch live notices from backend
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setNoticesLoading(true)
        const response = await fetch(`${API_BASE_URL}/notices/public`)
        const data = await response.json()

        if (response.ok && data.success) {
          setNotices(data.data)
        } else {
          setNoticesError(data.message || 'Failed to load notices')
        }
      } catch {
        setNoticesError('Unable to connect to server')
      } finally {
        setNoticesLoading(false)
      }
    }

    fetchNotices()
  }, [])

  const handleTextChange = (e) => {
    const text = e.target.value
    setNoticeText(text)
    setCharCount(text.length)
    if (error) setError('')
  }

  const handleSummarize = async () => {
    if (!noticeText.trim()) {
      setError('Please paste or type a notice to summarize.')
      return
    }

    if (noticeText.trim().length < 20) {
      setError('Notice is too short. Please enter a longer notice.')
      return
    }

    setIsLoading(true)
    setError('')
    setSummary('')

    try {
      const response = await apiFetch('/notices/summarize', {
        method: 'POST',
        body: JSON.stringify({ noticeText: noticeText.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to summarize notice.')
      }

      setSummary(data.summary)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setNoticeText('')
    setSummary('')
    setError('')
    setCharCount(0)
    setSelectedNoticeId(null)
    textareaRef.current?.focus()
  }

  const handleNoticeClick = (notice) => {
    // Build the full notice text for summarization
    const fullText = `${notice.title}\n\n${notice.content}`
    setNoticeText(fullText)
    setCharCount(fullText.length)
    setSummary('')
    setError('')
    setSelectedNoticeId(notice._id)

    // Scroll to workspace
    const workspace = document.querySelector('.notice-workspace')
    if (workspace) {
      workspace.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  return (
    <main className="notice-page">
      <section className="notice-hero">
        <div className="notice-hero-badge">
          <span className="hero-sparkle">✦</span>
          AI-Powered
        </div>
        <h1>Notice Summarizer</h1>
        <p>
          Select an admin notice below or paste any notice, and let AI instantly extract
          key deadlines, required actions, and important details.
        </p>
      </section>

      {/* ── Live Admin Notices ── */}
      <section className="live-notices-section">
        <div className="live-notices-header">
          <div className="live-notices-title-row">
            <span className="live-dot" />
            <h3>Admin Notices</h3>
            <span className="notices-count-badge">
              {notices.length} {notices.length === 1 ? 'notice' : 'notices'}
            </span>
          </div>
          <p className="live-notices-subtitle">
            Click any notice to load it into the summarizer
          </p>
        </div>

        {noticesLoading ? (
          <div className="notices-loading-state">
            <div className="notices-loading-shimmer" />
            <div className="notices-loading-shimmer" />
            <div className="notices-loading-shimmer" />
          </div>
        ) : noticesError ? (
          <div className="notices-error-state">
            <span>⚠️</span> {noticesError}
          </div>
        ) : notices.length === 0 ? (
          <div className="notices-empty-state">
            <span className="empty-icon">📭</span>
            <p>No notices posted yet</p>
            <p className="empty-sub">Notices posted by admins will appear here</p>
          </div>
        ) : (
          <div className="notices-grid">
            {notices.map((notice) => {
              const priorityConfig = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.Medium
              const emoji = CATEGORY_EMOJI[notice.category] || '📋'
              const isSelected = selectedNoticeId === notice._id

              return (
                <button
                  key={notice._id}
                  className={`live-notice-card ${isSelected ? 'selected' : ''} ${priorityConfig.className}`}
                  onClick={() => handleNoticeClick(notice)}
                  id={`notice-${notice._id}`}
                >
                  <div className="live-notice-top">
                    <span className="notice-category-badge">
                      {emoji} {notice.category}
                    </span>
                    <span className={`notice-priority-badge ${priorityConfig.className}`}>
                      {priorityConfig.label}
                    </span>
                  </div>

                  <h4 className="live-notice-title">{notice.title}</h4>

                  <p className="live-notice-preview">
                    {notice.content.length > 120
                      ? notice.content.slice(0, 120) + '…'
                      : notice.content}
                  </p>

                  <div className="live-notice-footer">
                    <span className="notice-time">{formatTimeAgo(notice.createdAt)}</span>
                    {isSelected && (
                      <span className="notice-loaded-badge">✓ Loaded</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Summarizer Workspace ── */}
      <section className="notice-workspace">
        {/* ── Input Panel ── */}
        <div className="notice-panel input-panel">
          <div className="panel-header">
            <div className="panel-title-row">
              <span className="panel-icon">📝</span>
              <h2>Notice Content</h2>
            </div>
            <span className="char-counter">{charCount.toLocaleString()} chars</span>
          </div>

          <textarea
            ref={textareaRef}
            className="notice-textarea"
            placeholder={"Select a notice above or paste one here…\n\nThe full notice text will appear here for AI summarization."}
            value={noticeText}
            onChange={handleTextChange}
            rows={14}
            id="notice-input"
          />

          <div className="panel-actions">
            <button
              className="btn-summarize"
              onClick={handleSummarize}
              disabled={isLoading || !noticeText.trim()}
              id="summarize-btn"
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Analyzing…
                </>
              ) : (
                <>
                  <span className="btn-sparkle">✨</span>
                  Summarize Notice
                </>
              )}
            </button>
            <button
              className="btn-clear"
              onClick={handleClear}
              disabled={isLoading}
              id="clear-btn"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="notice-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {/* ── Output Panel ── */}
        <div className={`notice-panel output-panel ${summary ? 'has-summary' : ''}`}>
          <div className="panel-header">
            <div className="panel-title-row">
              <span className="panel-icon">⚡</span>
              <h2>AI Summary</h2>
            </div>
            {summary && (
              <button className="btn-copy" onClick={handleCopySummary} title="Copy summary">
                📋 Copy
              </button>
            )}
          </div>

          <div className="summary-output" id="summary-output">
            {isLoading ? (
              <div className="summary-loading">
                <div className="loading-orb" />
                <p>AI is analyzing the notice…</p>
                <p className="loading-sub">Extracting deadlines, actions &amp; key details</p>
              </div>
            ) : summary ? (
              <div className="summary-content">{summary}</div>
            ) : (
              <div className="summary-placeholder">
                <span className="placeholder-icon">🤖</span>
                <p>Your AI-generated summary will appear here</p>
                <p className="placeholder-sub">
                  Select a notice above or paste one, then click &quot;Summarize&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default NoticeSummarizer
