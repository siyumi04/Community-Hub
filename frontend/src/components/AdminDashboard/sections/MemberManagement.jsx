import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { apiFetch } from '../../../services/apiClient'
import { showPopup, showConfirm } from '../../../utils/popup'

function MemberManagement({ admin, memberStats }) {
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
    mainType: '',
    category: '',
    role: '',
    notes: '',
  })
  // Main type configuration: Sport, Club, Society, Committee, etc.
  const MAIN_TYPE_CONFIG = [
    {
      id: 'sport',
      label: 'Sport',
      categories: [
        {
          id: 'cricket',
          label: 'Cricket',
          roles: ['Batsman', 'Bowler', 'All-rounder', 'Wicket Keeper'],
        },
        {
          id: 'football',
          label: 'Football',
          roles: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
        },
        {
          id: 'basketball',
          label: 'Basketball',
          roles: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
        },
        {
          id: 'volleyball',
          label: 'Volleyball',
          roles: ['Spiker', 'Setter', 'Libero', 'Blocker'],
        },
        {
          id: 'hockey',
          label: 'Hockey',
          roles: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
        },
        {
          id: 'badminton',
          label: 'Badminton',
          roles: ['Singles', 'Doubles', 'Mixed Doubles'],
        },
        {
          id: 'rugby',
          label: 'Rugby',
          roles: ['Prop', 'Hooker', 'Lock', 'Flanker', 'Scrum-half', 'Fly-half', 'Centre', 'Wing', 'Fullback'],
        },
        {
          id: 'athletics',
          label: 'Athletics',
          roles: ['Sprinter', 'Middle-distance', 'Long-distance', 'Thrower', 'Jumper'],
        },
        {
          id: 'swimming',
          label: 'Swimming',
          roles: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Medley'],
        },
        {
          id: 'table-tennis',
          label: 'Table Tennis',
          roles: ['Singles', 'Doubles', 'Mixed Doubles'],
        },
      ],
    },
    {
      id: 'club',
      label: 'Club',
      categories: [
        {
          id: 'drama-club',
          label: 'Drama Club',
          roles: ['Member', 'Secretary', 'Treasurer', 'President'],
        },
        {
          id: 'music-club',
          label: 'Music Club',
          roles: ['Member', 'Lead', 'Secretary', 'President'],
        },
      ],
    },
    {
      id: 'society',
      label: 'Society',
      categories: [
        {
          id: 'it-society',
          label: 'IT Society',
          roles: ['Member', 'Committee Member', 'Vice President', 'President'],
        },
      ],
    },
    {
      id: 'committee',
      label: 'Committee',
      categories: [
        {
          id: 'student-council',
          label: 'Student Council',
          roles: ['Member', 'Coordinator', 'Secretary', 'President'],
        },
      ],
    },
  ]

  const selectedMainType = MAIN_TYPE_CONFIG.find((t) => t.id === formData.mainType)
  const selectedCategory = selectedMainType?.categories.find((c) => c.id === formData.category)

  const selectedEditMainType =
    editData && editData.mainType
      ? MAIN_TYPE_CONFIG.find((t) => t.id === editData.mainType)
      : null
  const selectedEditCategory =
    selectedEditMainType && editData?.category
      ? selectedEditMainType.categories.find((c) => c.id === editData.category)
      : null

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
    if (
      !formData.name ||
      !formData.email ||
      !formData.itNumber ||
      !formData.mainType ||
      !formData.category ||
      !formData.role
    ) {
      showPopup('error', 'Validation', 'Please fill all required fields including type, category and role')
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
        setFormData({ name: '', email: '', itNumber: '', mainType: '', category: '', role: '', notes: '' })
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
    } catch (err) {
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
    } catch (err) {
      showPopup('error', 'Error', 'Failed to ban member')
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
        member.mainType || '',
        member.role || 'Member',
        new Date(member.joinedDate).toLocaleDateString(),
      ])

      doc.autoTable({
        startY: 22,
        head: [['Name', 'Email', 'Type', 'Role', 'Joined Date']],
        body: tableBody,
      })

      doc.save('members.pdf')
      showPopup('success', 'Success', 'Members PDF exported!')
    } catch (err) {
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
          <button
            className="btn btn-secondary"
            onClick={() => setView(view === 'pending' ? 'all' : 'pending')}
          >
            Member Requests{memberStats?.pending ? ` (${memberStats.pending})` : ''}
          </button>
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
            <div className="form-row">
              <select
                value={formData.mainType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mainType: e.target.value,
                    category: '',
                    role: '',
                  })}
                required
              >
                <option value="">Select Main Type</option>
                {MAIN_TYPE_CONFIG.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                    role: '',
                  })}
                required
                disabled={!selectedMainType}
              >
                <option value="">Select Category</option>
                {selectedMainType?.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                disabled={!selectedCategory}
              >
                <option value="">Select Role</option>
                {selectedCategory?.roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
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
                <th>Type</th>
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
                  <td>{member.mainType || member.sport || '-'}</td>
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
                              mainType: member.mainType || (member.sport ? 'sport' : ''),
                              category: member.category || member.sport || '',
                              role: member.role || '',
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
              try {
                const response = await apiFetch(`/members/${editingMember._id}`, {
                  method: 'PATCH',
                  body: JSON.stringify(editData),
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
            <div className="form-row">
              <select
                value={editData.mainType}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    mainType: e.target.value,
                    category: '',
                    role: '',
                  })}
                required
              >
                <option value="">Select Main Type</option>
                {MAIN_TYPE_CONFIG.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <select
                value={editData.category}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    category: e.target.value,
                    role: '',
                  })}
                required
                disabled={!selectedEditMainType}
              >
                <option value="">Select Category</option>
                {selectedEditMainType?.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                required
                disabled={!selectedEditCategory}
              >
                <option value="">Select Role</option>
                {selectedEditCategory?.roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
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
