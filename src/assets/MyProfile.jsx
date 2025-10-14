import React, { useState, useEffect, useRef } from 'react'
import './myprofile.css'
import { apiRequest, getUser } from '../lib/api'

export default function MyProfile({ onNavigateBack }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    location: '',
    bio: '',
  })
  const [profileImage, setProfileImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadMyProfile()
  }, [])

  const loadMyProfile = async () => {
    try {
      setLoading(true)
      const currentUser = getUser()
      
      if (!currentUser || !currentUser.id) {
        setError('Please login to view your profile')
        return
      }

      // Load user profile from API
      const data = await apiRequest(`/users/${currentUser.id}`)
      if (data && data.user) {
        const userData = {
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
        }
        setUser(userData)
        setEditData({
          name: userData.name,
          location: userData.location,
          bio: userData.bio,
        })
      } else {
        throw new Error('Profile not found')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load your profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing, reset form
      setEditData({
        name: user.name,
        location: user.location,
        bio: user.bio,
      })
      setProfileImage(null)
      setPreviewUrl(null)
    }
    setIsEditing(!isEditing)
    setSuccessMessage('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      setProfileImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage('')

      const currentUser = getUser()
      
      // Prepare FormData for profile update
      const formData = new FormData()
      formData.append('name', editData.name)
      formData.append('location', editData.location)
      formData.append('bio', editData.bio)
      
      if (profileImage) {
        formData.append('avatar', profileImage)
      }

      // Update profile via API
      const response = await apiRequest(`/users/${currentUser.id}`, {
        method: 'POST',
        body: formData
      })

      if (response.user) {
        // Update local user state
        const updatedUserData = {
          ...user,
          name: response.user.name,
          location: response.user.location,
          bio: response.user.bio,
          avatar: response.user.avatar_url || user.avatar,
          avatarLetter: response.user.name.charAt(0).toUpperCase()
        }
        setUser(updatedUserData)
        
        // Update localStorage
        const storedUser = getUser()
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          name: response.user.name,
          avatar_url: response.user.avatar_url
        }))
        
        setIsEditing(false)
        setProfileImage(null)
        setPreviewUrl(null)
        setSuccessMessage('✓ Profile updated successfully!')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setError(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="my-profile">
        <div className="profile-header">
          <button className="back-btn" onClick={onNavigateBack}>←</button>
          <h1>My Profile</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">⟳</div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="my-profile">
        <div className="profile-header">
          <button className="back-btn" onClick={onNavigateBack}>←</button>
          <h1>My Profile</h1>
        </div>
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={onNavigateBack} className="retry-btn">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="my-profile">
      <div className="profile-header">
        <button className="back-btn" onClick={onNavigateBack}>←</button>
        <h1>My Profile</h1>
        <button className="edit-profile-btn" onClick={handleEditToggle}>
          {isEditing ? '✕ Cancel' : '✎ Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        
        {error && (
          <div className="error-message">❌ {error}</div>
        )}

        <div className="profile-card">
          <div className="profile-avatar-container">
            {isEditing ? (
              <div className="avatar-edit-wrapper">
                <div className="profile-avatar" onClick={() => fileInputRef.current?.click()}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="avatar-image" />
                  ) : user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="avatar-image" />
                  ) : (
                    user.avatarLetter
                  )}
                  <div className="avatar-overlay">
                    <span className="camera-icon">📷</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <p className="upload-hint">Click to upload photo</p>
              </div>
            ) : (
              <div className="profile-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="avatar-image" />
                ) : (
                  user.avatarLetter
                )}
              </div>
            )}
          </div>

          <div className="profile-info">
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                className="edit-input name-input"
                placeholder="Your name"
              />
            ) : (
              <h2>{user.name}</h2>
            )}
            <p className="profile-email">{user.email}</p>
            
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={editData.location}
                onChange={handleInputChange}
                className="edit-input location-input"
                placeholder="Your location"
              />
            ) : (
              <p className="profile-location">📍 {user.location}</p>
            )}
            
            <div className="profile-rating">
              <span className="stars">⭐⭐⭐⭐⭐</span>
              <span className="rating-text">{user.rating}/5.0</span>
            </div>
          </div>
        </div>

        <div className="profile-bio">
          <h3>About</h3>
          {isEditing ? (
            <textarea
              name="bio"
              value={editData.bio}
              onChange={handleInputChange}
              className="edit-textarea"
              placeholder="Tell others about yourself..."
              rows="5"
            />
          ) : (
            <p>{user.bio}</p>
          )}
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

        {isEditing && (
          <div className="profile-actions">
            <button 
              className="action-btn primary" 
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? '⟳ Saving...' : '💾 Save Changes'}
            </button>
            <button 
              className="action-btn secondary" 
              onClick={handleEditToggle}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
