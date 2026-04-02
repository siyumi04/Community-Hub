import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './AdminDashboard.css'

function AdminDashboard() {
  const { dashboardName } = useParams()
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)

  useEffect(() => {
    const storedAdmin = localStorage.getItem('currentAdmin')
    if (!storedAdmin) {
      navigate('/login')
      return
    }

    try {
      const adminData = JSON.parse(storedAdmin)
      if (adminData.dashboardName !== dashboardName) {
        navigate('/login')
        return
      }
      setAdmin(adminData)
    } catch (err) {
      navigate('/login')
    }
  }, [dashboardName, navigate])

  if (!admin) {
    return <div className="admin-dashboard">Loading...</div>
  }

  return (
    <main className="admin-dashboard">
      <div className="admin-container">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p>{admin.dashboardName}</p>
        </div>

        <div className="admin-info">
          <div className="info-card">
            <h3>Welcome, {admin.firstName}!</h3>
            <p>Dashboard: <code>{admin.dashboardName}</code></p>
            <p>Username: <code>{admin.username}</code></p>
            <p>Email: {admin.email}</p>
          </div>
        </div>

        <div className="admin-content">
          <p>Your admin dashboard is ready to use.</p>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>
            More features coming soon...
          </p>
        </div>
      </div>
    </main>
  )
}

export default AdminDashboard
