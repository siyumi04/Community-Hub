import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'
import { showPopup } from '../../../utils/popup'

function MemberManagement({ admin }) {
  const [members, setMembers] = useState([])
  const [view, setView] = useState('all') // 'all', 'pending', 'approved'
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    itNumber: '',
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
    } catch (err) {
      showPopup('error', 'Error', 'Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.itNumber) {
      showPopup('error', 'Validation', 'Please fill all required fields')
      return
    }

    try {
      const response = await apiFetch('/members/add', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        showPopup('success', 'Success', 'Member added successfully')
        setFormData({ name: '', email: '', itNumber: '', notes: '' })
        setShowAddMemberForm(false)
        fetchMembers()
      } else {
        showPopup('error', 'Error', data.message)
      }
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      showPopup('error', 'Error', 'Failed to promote member')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return
    try {
      const response = await apiFetch(`/members/${memberId}/remove`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'remove' }),
      })
      if (response.ok) {
        showPopup('success', 'Success', 'Member removed!')
        fetchMembers()
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to remove member')
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await apiFetch('/members/export/csv')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'members.csv'
        a.click()
        showPopup('success', 'Success', 'Members list exported!')
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to export members')
    }
  }

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="member-management">
      <div className="section-header">
        <h2>👥 Member Management</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={() => setShowAddMemberForm(!showAddMemberForm)}>
            ➕ Add Member
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
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

      {/* View Tabs */}
      <div className="tabs">
        <button className={`tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>
          All Members ({members.length})
        </button>
        <button className={`tab ${view === 'pending' ? 'active' : ''}`} onClick={() => setView('pending')}>
          Pending Approval
        </button>
      </div>

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
    </div>
  )
}

export default MemberManagement
