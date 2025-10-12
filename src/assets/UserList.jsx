import React, { useState, useEffect } from 'react'
import './userlist.css'
import { apiRequest } from '../lib/api'

export default function UserList({ onNavigateBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/auth/users')
      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="status-badge active">Active</span>
    ) : (
      <span className="status-badge inactive">Pending</span>
    )
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <div className="header-nav">
          <button className="back-btn" onClick={onNavigateBack}>←</button>
          <h1>User Management</h1>
          <div className="header-actions">
            <button className="refresh-btn" onClick={loadUsers} disabled={loading}>
              {loading ? '⟳' : '↻'}
            </button>
          </div>
        </div>
        
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{users.filter(u => u.is_active).length}</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{users.filter(u => !u.is_active).length}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      <div className="user-list-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">⟳</div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={loadUsers} className="retry-btn">Try Again</button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>📝 No users found</p>
            <p>Users will appear here when they create accounts</p>
          </div>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <div className="col-name">Name</div>
              <div className="col-email">Email</div>
              <div className="col-status">Status</div>
              <div className="col-date">Joined</div>
            </div>
            <div className="table-body">
              {users.map(user => (
                <div key={user.id} className="user-row">
                  <div className="col-name">
                    <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-id">ID: {user.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                  <div className="col-email">{user.email}</div>
                  <div className="col-status">{getStatusBadge(user.is_active)}</div>
                  <div className="col-date">{formatDate(user.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
