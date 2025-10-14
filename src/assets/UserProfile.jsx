import React, { useState, useEffect } from 'react'
import './userprofile.css'
import { apiRequest } from '../lib/api'

export default function UserProfile({ userId, onNavigateBack, onStartChat }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      loadUserProfile()
    }
  }, [userId])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      // Load real user data from API
      const data = await apiRequest(`/users/${userId}`)
      if (data && data.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          joinDate: data.user.created_at,
          totalProducts: data.user.total_products || 0,
          totalSales: data.user.total_sales || 0,
          rating: data.user.rating || 0,
          bio: data.user.bio || 'No bio available',
          location: data.user.location || 'Location not specified',
          avatar: data.user.avatar_url || null,
          avatarLetter: data.user.name.charAt(0).toUpperCase()
        })
      } else {
        throw new Error('User not found')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(user)
    }
  }

  if (loading) {
    return (
      <div className="user-profile">
        <div className="profile-header">
          <button className="back-btn" onClick={onNavigateBack}>←</button>
          <h1>Profile</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">⟳</div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="user-profile">
        <div className="profile-header">
          <button className="back-btn" onClick={onNavigateBack}>←</button>
          <h1>Profile</h1>
        </div>
        <div className="error-state">
          <p>❌ {error || 'User not found'}</p>
          <button onClick={onNavigateBack} className="retry-btn">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <button className="back-btn" onClick={onNavigateBack}>←</button>
        <h1>User Profile</h1>
        <button className="message-profile-btn" onClick={handleStartChat}>
          💬 Message
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="avatar-image" />
            ) : (
              user.avatarLetter
            )}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            <p className="profile-location">📍 {user.location}</p>
            <div className="profile-rating">
              <span className="stars">⭐⭐⭐⭐⭐</span>
              <span className="rating-text">{user.rating}/5.0</span>
            </div>
          </div>
        </div>

        <div className="profile-bio">
          <h3>About</h3>
          <p>{user.bio}</p>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-number">{user.totalProducts}</div>
            <div className="stat-label">Products Listed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user.totalSales}</div>
            <div className="stat-label">Total Sales</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user.joinDate}</div>
            <div className="stat-label">Member Since</div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="action-btn primary" onClick={handleStartChat}>
            💬 Start Conversation
          </button>
          <button className="action-btn secondary" onClick={onNavigateBack}>
            View Products
          </button>
        </div>
      </div>
    </div>
  )
}
