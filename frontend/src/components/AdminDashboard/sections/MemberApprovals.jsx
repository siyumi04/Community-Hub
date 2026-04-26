import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../../../services/apiClient'
import { showPopup, showConfirm } from '../../../utils/popup'

const formatFieldLabel = (key = '') =>
  String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

/** Extra form fields only — skip duplicates of top-level IT number. */
function getClubSpecificFields(request) {
  const raw = request.additionalFields
  if (!raw || typeof raw !== 'object') return []

  const it = String(request.studentNumber || '').trim().toUpperCase()
  return Object.entries(raw).filter(([key, value]) => {
    const k = key.toLowerCase()
    if (['studentnumber', 'student_id', 'studentid', 'itnumber'].includes(k)) {
      const v = String(value || '').trim().toUpperCase()
      if (!v || v === it) return false
    }
    return String(value ?? '').trim() !== ''
  })
}

function FieldRow({ label, children }) {
  return (
    <div className="approval-field">
      <span className="approval-field-label">{label}</span>
      <span className="approval-field-value">{children}</span>
    </div>
  )
}

const resolveCommunityIdFromDashboardName = (dashboardName = '') => {
  const normalized = String(dashboardName).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.includes('cricket')) return 'cricket'
  if (normalized.includes('hockey') || normalized.includes('hokey')) return 'hockey'
  if (normalized.includes('environmental') || normalized.includes('enviromental')) return 'environmental'
  if (normalized.includes('foc')) return 'foc'
  if (normalized.includes('food')) return 'food'
  return ''
}

function MemberApprovals({ admin }) {
  const { dashboardName: dashboardNameFromRoute } = useParams()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState('')

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const effectiveDashboard = admin?.dashboardName || dashboardNameFromRoute || ''
      const communityIdHint = resolveCommunityIdFromDashboardName(effectiveDashboard)
      const search = new URLSearchParams()
      if (effectiveDashboard) search.set('dashboardName', effectiveDashboard)
      if (communityIdHint) search.set('communityId', communityIdHint)
      const query = search.toString() ? `?${search.toString()}` : ''
      const response = await apiFetch(`/communities/admin/member-requests${query}`)
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch membership requests')
      }
      setRequests(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      showPopup('error', 'Error', error.message || 'Failed to fetch membership requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId)
      const effectiveDashboard = admin?.dashboardName || dashboardNameFromRoute || ''
      const communityIdHint = resolveCommunityIdFromDashboardName(effectiveDashboard)
      const search = new URLSearchParams()
      if (effectiveDashboard) search.set('dashboardName', effectiveDashboard)
      if (communityIdHint) search.set('communityId', communityIdHint)
      const query = search.toString() ? `?${search.toString()}` : ''
      const response = await apiFetch(`/communities/admin/member-requests/${requestId}/approve${query}`, {
        method: 'PATCH',
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to approve request')
      }
      showPopup('success', 'Success', 'Membership approved successfully')
      setRequests((prev) => prev.filter((request) => request._id !== requestId))
    } catch (error) {
      showPopup('error', 'Error', error.message || 'Failed to approve request')
    } finally {
      setProcessingId('')
    }
  }

  const handleReject = async (requestId) => {
    const confirmed = await showConfirm({
      title: 'Reject Membership Request?',
      text: 'This student will be able to submit a re-request later.',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      icon: 'warning',
    })
    if (!confirmed) return

    try {
      setProcessingId(requestId)
      const effectiveDashboard = admin?.dashboardName || dashboardNameFromRoute || ''
      const communityIdHint = resolveCommunityIdFromDashboardName(effectiveDashboard)
      const search = new URLSearchParams()
      if (effectiveDashboard) search.set('dashboardName', effectiveDashboard)
      if (communityIdHint) search.set('communityId', communityIdHint)
      const query = search.toString() ? `?${search.toString()}` : ''
      const response = await apiFetch(`/communities/admin/member-requests/${requestId}/reject${query}`, {
        method: 'PATCH',
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reject request')
      }
      showPopup('success', 'Success', 'Membership request rejected')
      setRequests((prev) => prev.filter((request) => request._id !== requestId))
    } catch (error) {
      showPopup('error', 'Error', error.message || 'Failed to reject request')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className="member-management member-approvals">
      <div className="section-header">
        <div>
          <h2>Member Approvals</h2>
          <p className="section-subtitle">Review pending join requests</p>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading membership requests...</p>
      ) : requests.length === 0 ? (
        <p className="empty">No pending membership requests</p>
      ) : (
        <div className="approval-requests-list">
          {requests.map((request) => {
            const extras = getClubSpecificFields(request)
            const why = String(request.whyJoin || '').trim()
            const requested = request.createdAt
              ? new Date(request.createdAt).toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : '—'

            return (
              <div key={request._id} className="event-card approval-request-card">
                <div className="event-header">
                  <h3>{request.fullName}</h3>
                  <span className="badge badge-pending">Pending</span>
                </div>

                <div className="event-details approval-request-details">
                  <div className="approval-request-grid">
                    <FieldRow label="Community">{request.communityName}</FieldRow>
                    <FieldRow label="Student ID">{request.studentNumber || '—'}</FieldRow>
                    <FieldRow label="Year">{request.year || '—'}</FieldRow>
                    <FieldRow label="Email">{request.email || '—'}</FieldRow>
                    <FieldRow label="Phone">{request.phone || '—'}</FieldRow>
                    <FieldRow label="Requested">{requested}</FieldRow>
                  </div>

                  {why ? (
                    <div className="approval-request-note">
                      <span className="approval-field-label">Why join</span>
                      <p className="approval-why-text">{why}</p>
                    </div>
                  ) : null}

                  {extras.length > 0 ? (
                    <div className="approval-club-fields">
                      <span className="approval-field-label approval-club-fields-title">Club form</span>
                      <div className="approval-request-grid approval-club-grid">
                        {extras.map(([key, value]) => (
                          <FieldRow key={key} label={formatFieldLabel(key)}>
                            {String(value)}
                          </FieldRow>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="event-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={processingId === request._id}
                    onClick={() => handleApprove(request._id)}
                  >
                    {processingId === request._id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={processingId === request._id}
                    onClick={() => handleReject(request._id)}
                  >
                    {processingId === request._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .member-approvals .approval-requests-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .member-approvals .approval-request-card .event-details {
          margin-bottom: 16px;
          padding: 12px 14px;
        }
        .member-approvals .approval-request-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
          align-items: start;
        }
        @media (max-width: 640px) {
          .member-approvals .approval-request-grid {
            grid-template-columns: 1fr;
          }
        }
        .member-approvals .approval-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .member-approvals .approval-field-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.45);
        }
        .member-approvals .approval-field-value {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.88);
          word-break: break-word;
        }
        .member-approvals .approval-request-note {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .member-approvals .approval-why-text {
          margin: 6px 0 0;
          font-size: 0.88rem;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.75);
        }
        .member-approvals .approval-club-fields {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .member-approvals .approval-club-fields-title {
          display: block;
          margin-bottom: 8px;
        }
        .member-approvals .approval-club-grid {
          margin-top: 0;
        }
      `}</style>
    </div>
  )
}

export default MemberApprovals
