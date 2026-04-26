import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { apiFetch } from '../../../services/apiClient'
import { showPopup, showConfirm } from '../../../utils/popup'

const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4']

/** Inline option styles help Windows/Chrome native dropdown contrast */
const YEAR_OPTION_PLACEHOLDER_STYLE = { backgroundColor: '#1e293b', color: '#cbd5e1' }
const YEAR_OPTION_STYLE = { backgroundColor: '#1e293b', color: '#f1f5f9' }

const isValidPhoneDigits = (value) => /^\d{10}$/.test(String(value || '').replace(/\D/g, ''))

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

function MemberManagement({ memberStats }) {
  const [members, setMembers] = useState([])
  const [view, setView] = useState('all') // 'all' or 'pending'
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [editData, setEditData] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    itNumber: '',
    phone: '',
    yearOfStudy: '',
    notes: '',
  })

  useEffect(() => {
    fetchMembers()
  }, [view])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const endpoint = view === 'pending' ? '/members/pending' : '/members'
      const response = await apiFetch(endpoint)
      const data = await response.json()
      if (response.ok && data.success) {
        setMembers(data.data)
      }
    } catch {
      showPopup('error', 'Error', 'Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    const name = formData.name.trim()
    const email = formData.email.trim()
    const itNumber = formData.itNumber.trim()
    const phoneDigits = formData.phone.replace(/\D/g, '')
    const yearOfStudy = formData.yearOfStudy.trim()

    if (!name || !email || !itNumber || !phoneDigits || !yearOfStudy) {
      showPopup('error', 'Validation', 'Please fill name, email, IT number, phone number, and year of study.')
      return
    }
    if (!isValidEmail(email)) {
      showPopup('error', 'Validation', 'Please enter a valid email address.')
      return
    }
    if (!isValidPhoneDigits(phoneDigits)) {
      showPopup('error', 'Validation', 'Phone number must be exactly 10 digits.')
      return
    }
    if (!YEAR_OPTIONS.includes(yearOfStudy)) {
      showPopup('error', 'Validation', 'Please select a valid year of study (Year 1–4).')
      return
    }

    try {
      const response = await apiFetch('/members/add', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          itNumber,
          phone: phoneDigits,
          yearOfStudy,
          notes: formData.notes,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        showPopup('success', 'Success', 'Member added successfully')
        setFormData({
          name: '',
          email: '',
          itNumber: '',
          phone: '',
          yearOfStudy: '',
          notes: '',
        })
        setShowAddMemberForm(false)
        fetchMembers()
      } else {
        showPopup('error', 'Error', data.message)
      }
    } catch {
      showPopup('error', 'Error', 'Failed to add member')
    }
  }

  const handleApproveMember = async (memberId) => {
    try {
      const response = await apiFetch(`/members/${memberId}/approve`, { method: 'PATCH' })
      if (response.ok) {
        showPopup('success', 'Success', 'Member approved!')
        fetchMembers()
      }
    } catch {
      showPopup('error', 'Error', 'Failed to approve member')
    }
  }

  const handleRejectMember = async (memberId) => {
    try {
      const response = await apiFetch(`/members/${memberId}/reject`, { method: 'PATCH' })
      if (response.ok) {
        showPopup('success', 'Success', 'Member rejected!')
        fetchMembers()
      }
    } catch {
      showPopup('error', 'Error', 'Failed to reject member')
    }
  }

  const handlePromoteMember = async (memberId, newRole) => {
    try {
      const response = await apiFetch(`/members/${memberId}/promote`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) {
        showPopup('success', 'Success', `Member promoted to ${newRole}!`)
        fetchMembers()
      }
    } catch {
      showPopup('error', 'Error', 'Failed to promote member')
    }
  }

  const handleRemoveMember = async (memberId) => {
    const confirmed = await showConfirm({
      title: 'Remove Member?',
      text: 'Are you sure you want to remove this member?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      icon: 'warning',
    })
    if (!confirmed) return

    try {
      const response = await apiFetch(`/members/${memberId}/remove`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'remove' }),
      })
      if (response.ok) {
        showPopup('success', 'Success', 'Member removed!')
        fetchMembers()
      }
    } catch {
      showPopup('error', 'Error', 'Failed to remove member')
    }
  }

  const handleBanMember = async (memberId) => {
    const confirmed = await showConfirm({
      title: 'Ban Member?',
      text: 'Are you sure you want to ban this member?',
      confirmText: 'Ban',
      cancelText: 'Cancel',
      icon: 'warning',
    })
    if (!confirmed) return

    try {
      const response = await apiFetch(`/members/${memberId}/remove`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'ban' }),
      })
      if (response.ok) {
        showPopup('success', 'Success', 'Member banned!')
        fetchMembers()
      }
    } catch {
      showPopup('error', 'Error', 'Failed to ban member')
    }
  }

  const handleExportPDF = () => {
    try {
      if (!members.length) {
        showPopup('info', 'No Data', 'There are no members to export.')
        return
      }

      const doc = new jsPDF()
      doc.text('Members Report', 14, 16)

      const tableBody = members.map((member) => [
        member.name,
        member.email,
        member.itNumber || '',
        member.phone || '',
        member.yearOfStudy || '',
        member.role || 'Member',
        new Date(member.joinedDate).toLocaleDateString(),
      ])

      doc.autoTable({
        startY: 22,
        head: [['Name', 'Email', 'IT No.', 'Phone', 'Year', 'Role', 'Joined']],
        body: tableBody,
      })

      doc.save('members.pdf')
      showPopup('success', 'Success', 'Members PDF exported!')
    } catch {
      showPopup('error', 'Error', 'Failed to export PDF')
    }
  }

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="member-management">
      {/* Header like reference design */}
      <div className="section-header">
        <div>
          <h2>Member Management</h2>
          <p className="section-subtitle">Manage your club members and review membership requests</p>
        </div>
        <div className="section-actions">
          {/* <button
            className="btn btn-secondary"
            onClick={() => setView(view === 'pending' ? 'all' : 'pending')}
          >
            Member Requests{memberStats?.pending ? ` (${memberStats.pending})` : ''}
          </button> */}
          <button className="btn btn-primary" onClick={() => setShowAddMemberForm(!showAddMemberForm)}>
            + Add Member
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            Download PDF
          </button>
        </div>
      </div>

      {/* Summary cards directly under header */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total Members</h3>
            <p className="stat-number">{memberStats?.approved ?? memberStats?.total ?? 0}</p>
            <p className="stat-detail">Current active members</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Pending Requests</h3>
            <p className="stat-number">{memberStats?.pending ?? 0}</p>
            <p className="stat-detail">Awaiting approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Capacity Available</h3>
            <p className="stat-number">{Math.max(0, 45 - (memberStats?.approved || 0))}</p>
            <p className="stat-detail">Out of 45 slots</p>
          </div>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddMemberForm && (
        <div className="form-card">
          <h3>Add New Member</h3>
          <form onSubmit={handleAddMember}>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="IT Number"
              value={formData.itNumber}
              onChange={(e) => setFormData({ ...formData, itNumber: e.target.value })}
              required
            />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Phone number (10 digits)"
              value={formData.phone}
              maxLength={15}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              required
            />
            <select
              className="admin-member-year-select"
              value={formData.yearOfStudy}
              onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
              required
            >
              <option value="" style={YEAR_OPTION_PLACEHOLDER_STYLE}>
                Select year of study
              </option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y} style={YEAR_OPTION_STYLE}>
                  {y}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Add Member
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddMemberForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Members Table */}
      <h3 className="subsection-title">Current Members ({members.length})</h3>
      {loading ? (
        <p className="loading">Loading members...</p>
      ) : filteredMembers.length > 0 ? (
        <div className="table-responsive">
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>IT Number</th>
                <th>Phone</th>
                <th>Year of study</th>
                <th>Status</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member._id} className={`status-${member.status}`}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.itNumber}</td>
                  <td>{member.phone || '-'}</td>
                  <td>{member.yearOfStudy || '-'}</td>
                  <td>
                    <span className={`badge badge-${member.status}`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                  <td>{member.role}</td>
                  <td>{new Date(member.joinedDate).toLocaleDateString()}</td>
                  <td className="actions">
                    {member.status === 'pending' && (
                      <>
                        <button
                          className="action-btn approve"
                          onClick={() => handleApproveMember(member._id)}
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          className="action-btn reject"
                          onClick={() => handleRejectMember(member._id)}
                          title="Reject"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {member.status === 'approved' && (
                      <>
                        <button
                          className="action-btn"
                          onClick={() => {
                            setEditingMember(member)
                            setEditData({
                              name: member.name || '',
                              email: member.email || '',
                              itNumber: member.itNumber || '',
                              phone: (member.phone || '').replace(/\D/g, '').slice(0, 10),
                              yearOfStudy: member.yearOfStudy || '',
                              notes: member.notes || '',
                            })
                          }}
                          title="Edit member"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn promote"
                          onClick={() => handlePromoteMember(member._id, 'Event Team')}
                          title="Promote to Event Team"
                        >
                          ⬆
                        </button>
                        <button
                          className="action-btn remove"
                          onClick={() => handleRemoveMember(member._id)}
                          title="Remove"
                        >
                          🗑
                        </button>
                        <button
                          className="action-btn ban"
                          onClick={() => handleBanMember(member._id)}
                          title="Ban"
                        >
                          🚫
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">No members found</p>
      )}

      {/* Edit Member Panel */}
      {editingMember && editData && (
        <div className="form-card">
          <h3>Edit Member</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const phoneDigits = (editData.phone || '').replace(/\D/g, '').slice(0, 10)
              if (!isValidPhoneDigits(phoneDigits)) {
                showPopup('error', 'Validation', 'Phone number must be exactly 10 digits.')
                return
              }
              if (!YEAR_OPTIONS.includes(editData.yearOfStudy)) {
                showPopup('error', 'Validation', 'Please select a valid year of study (Year 1–4).')
                return
              }
              if (!isValidEmail(editData.email)) {
                showPopup('error', 'Validation', 'Please enter a valid email address.')
                return
              }
              try {
                const response = await apiFetch(`/members/${editingMember._id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    ...editData,
                    phone: phoneDigits,
                  }),
                })
                const data = await response.json()
                if (!response.ok || !data.success) {
                  throw new Error(data.message || 'Failed to update member')
                }
                showPopup('success', 'Updated', 'Member updated successfully')
                setEditingMember(null)
                setEditData(null)
                fetchMembers()
              } catch (err) {
                showPopup('error', 'Error', err.message || 'Failed to update member')
              }
            }}
          >
            <input
              type="text"
              placeholder="Full Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="IT Number"
              value={editData.itNumber}
              onChange={(e) => setEditData({ ...editData, itNumber: e.target.value })}
              required
            />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Phone number (10 digits)"
              value={editData.phone}
              maxLength={15}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                })
              }
              required
            />
            <select
              className="admin-member-year-select"
              value={editData.yearOfStudy}
              onChange={(e) => setEditData({ ...editData, yearOfStudy: e.target.value })}
              required
            >
              <option value="" style={YEAR_OPTION_PLACEHOLDER_STYLE}>
                Select year of study
              </option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y} style={YEAR_OPTION_STYLE}>
                  {y}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Notes (optional)"
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingMember(null)
                  setEditData(null)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

export default MemberManagement
