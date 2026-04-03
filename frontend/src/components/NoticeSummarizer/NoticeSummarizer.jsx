import { useState, useRef } from 'react'
import { apiFetch } from '../../services/apiClient'
import './NoticeSummarizer.css'

const SAMPLE_NOTICES = [
  {
    label: '📚 Exam Schedule Notice',
    text: `IMPORTANT NOTICE: Final Examination Schedule – Semester 2, 2026

Dear Students,

This is to inform all undergraduate students of the Faculty of Computing that the final examinations for Semester 2, 2026 will be conducted from April 21, 2026 to May 9, 2026. The examination timetable has been uploaded to the university portal.

All students are required to:
1. Collect their examination admission cards from the Student Services Division before April 14, 2026.
2. Students who have not settled their tuition fees will NOT be permitted to sit for examinations. The deadline for fee payment is April 10, 2026.
3. Report to the examination hall 30 minutes before the scheduled start time.
4. Bring a valid university ID card and admission card to every examination.
5. Students requesting special accommodations must submit their applications to the Dean's office by April 7, 2026.

Please note that no electronic devices (including smartwatches) are permitted in the examination hall. Any student found violating examination regulations will face disciplinary action as per university policy.

For any queries, contact the Examination Division at exams@university.lk or visit Room 205 during office hours (9:00 AM - 4:00 PM).

Regards,
Senior Assistant Registrar – Examinations`,
  },
  {
    label: '🎉 Club Registration',
    text: `NOTICE: Student Club Registrations Open for Academic Year 2026/2027

The Student Affairs Division is pleased to announce that registrations for student clubs and societies for the academic year 2026/2027 are now open. All students from Year 1 to Year 4 are encouraged to join at least one club to enhance their university experience.

Registration Period: April 5, 2026 – April 20, 2026
Registration Method: Online via the Student Portal → "Club Registration" tab
Club Fair: April 8, 2026, 10:00 AM – 3:00 PM at the University Auditorium

Available clubs include: Cricket Club, Hockey Club, Environmental Community, FOC Event Club, Food & Beverages Community, Robotics Society, Drama Circle, Debating Society, and more.

Each student can register for a maximum of 3 clubs. Selection will be confirmed via email by April 25, 2026. Students who were office bearers last year must re-apply if they wish to continue.

For more details, contact the Student Affairs Division at studentaffairs@university.lk.`,
  },
  {
    label: '🏗️ Maintenance Notice',
    text: `URGENT NOTICE: Scheduled Maintenance – IT Infrastructure

Dear Faculty and Students,

Please be informed that the IT Services Department will be conducting scheduled maintenance on the university's network infrastructure on Saturday, April 12, 2026 from 6:00 AM to 6:00 PM.

During this period:
- The Student Portal, LMS (Learning Management System), and email services will be unavailable
- Wi-Fi connectivity across all campus buildings will be intermittently disrupted
- Library online catalog and e-resource access will be offline
- VPN services for remote access will not be functional

All students are advised to:
- Download any required learning materials before April 11, 2026
- Save all ongoing work on cloud platforms before the maintenance window
- Submit any pending assignments before April 11, 2026, 11:59 PM as the submission portal will be offline
- Plan offline study activities for the maintenance day

Assignment deadlines falling on April 12 have been extended to April 13, 2026, 11:59 PM.

We apologize for the inconvenience. For emergencies during the maintenance window, contact the IT Help Desk at 011-2345678.

IT Services Department`,
  },
]

function NoticeSummarizer() {
  const [noticeText, setNoticeText] = useState('')
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef(null)

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
    textareaRef.current?.focus()
  }

  const handleSampleClick = (sampleText) => {
    setNoticeText(sampleText)
    setCharCount(sampleText.length)
    setSummary('')
    setError('')
  }

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary)
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
          Paste any long university notice and let AI instantly extract key deadlines,
          required actions, and important details into concise bullet points.
        </p>
      </section>

      <section className="notice-workspace">
        {/* ── Input Panel ── */}
        <div className="notice-panel input-panel">
          <div className="panel-header">
            <div className="panel-title-row">
              <span className="panel-icon">📝</span>
              <h2>Original Notice</h2>
            </div>
            <span className="char-counter">{charCount.toLocaleString()} chars</span>
          </div>

          <textarea
            ref={textareaRef}
            className="notice-textarea"
            placeholder="Paste your notice here…&#10;&#10;For example, exam schedules, club registration notices, maintenance alerts, or any university announcement."
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
                  Paste a notice and click &quot;Summarize&quot; to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Sample Notices ── */}
      <section className="samples-section">
        <h3>Try a Sample Notice</h3>
        <div className="samples-grid">
          {SAMPLE_NOTICES.map((sample) => (
            <button
              key={sample.label}
              className="sample-card"
              onClick={() => handleSampleClick(sample.text)}
            >
              <span className="sample-label">{sample.label}</span>
              <span className="sample-preview">
                {sample.text.slice(0, 90)}…
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default NoticeSummarizer
