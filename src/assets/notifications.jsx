import React, { useEffect, useState } from 'react'
import './notifications.css'
import { getNotifications, clearNotifications, removeNotificationForSeller } from '../lib/notifications'
import { apiRequest } from '../lib/api'

export default function Notifications({ user, onNavigateBack, onNavigateToProfile, onStartChat }) {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    // Try fetching server-side notifications if signed in; otherwise use localStorage
    async function load() {
      if (user && user.id) {
        try {
          console.log('Loading notifications for user:', user.id)
          const res = await apiRequest('/notifications')
          console.log('Notifications API response:', res)
          if (res && Array.isArray(res.notifications)) {
            console.log('Found notifications:', res.notifications.length)
            // Normalize to the client shape with enhanced data
            const normalized = res.notifications.map(n => ({
              sellerId: n.seller_id,
              buyerId: n.buyer_id,
              buyerName: n.buyer_name || n.buyer?.name || 'Unknown Buyer',
              productId: n.product_id,
              productName: n.product_name,
              productPrice: n.product_price,
              productImage: n.product_image,
              date: n.created_at,
              id: n.id,
              is_read: n.is_read
            }))
            console.log('Normalized notifications:', normalized)
            setNotes(normalized)
            return
          }
        } catch (e) {
          // API may be unavailable or unauthorized; fall back to localStorage
          console.warn('Failed to load server notifications, falling back to local storage', e)
        }
      }

      const all = getNotifications()
      const filtered = (user && user.id) ? all.filter(n => n.sellerId === user.id) : []
      console.log('Local notifications:', filtered)
      setNotes(filtered)
    }

    load()
    
    // Set up polling to check for new notifications every 5 seconds
    const interval = setInterval(load, 5000)
    
    return () => clearInterval(interval)
  }, [user])

  const handleTestNotification = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/test/notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seller_id: user.id,
          buyer_id: 'test-buyer-' + Date.now(),
          product_name: 'Test Product',
          product_price: 100.00,
          buyer_name: 'Test Buyer'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Test notification created:', data)
        alert('Test notification created! Check the notifications.')
        // Reload notifications
        window.location.reload()
      } else {
        console.error('Failed to create test notification')
        alert('Failed to create test notification')
      }
    } catch (error) {
      console.error('Error creating test notification:', error)
      alert('Error creating test notification')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear all notifications?')) return
    if (user && user.id) {
      try { await apiRequest(`/notifications`, { method: 'DELETE' }) } catch (e) {}
      setNotes([])
      return
    }
    clearNotifications()
    setNotes([])
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (!window.confirm('Delete this notification?')) return
    if (user && user.id) {
      try { await apiRequest(`/notifications/${id}`, { method: 'DELETE' }) } catch (e) {}
      setNotes(prev => prev.filter(n => n.id !== id))
      return
    }
    removeNotificationForSeller(id, user?.id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const handleViewProfile = (buyerId, buyerName) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(buyerId, buyerName)
    }
  }

  const handleMessageBuyer = (buyerId, buyerName) => {
    if (onStartChat) {
      onStartChat({ id: buyerId, name: buyerName })
    }
  }

  return (
    <div className="notes-page">
      <div className="notes-header">
        <button className="back-btn" onClick={onNavigateBack}>←</button>
        <h2>Purchase Notifications</h2>
        <div className="header-actions">
          <button className="test-btn" onClick={handleTestNotification}>Test</button>
          <button className="clear-btn" onClick={handleClear}>Clear all</button>
        </div>
      </div>

      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="empty">No purchase notifications yet.</div>
        ) : (
          notes.map((n, i) => (
            <div className="note-item" key={n.id || i}>
              <div className="product-image">
                {n.productImage ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/storage/${n.productImage}`.replace('/api', '')} 
                    alt={n.productName}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="placeholder-image" style={{ display: n.productImage ? 'none' : 'flex' }}>📦</div>
              </div>
              
              <div className="note-body">
                <div className="note-title">
                  <span className="buyer-name">{n.buyerName || 'Unknown Buyer'}</span> purchased your item
                </div>
                <div className="note-sub">{n.productName || 'an item'}</div>
                {n.productPrice && (
                  <div className="note-price">₱{parseFloat(n.productPrice).toFixed(2)}</div>
                )}
                <div className="note-meta">{new Date(n.date).toLocaleString()}</div>
              </div>
              
              <div className="note-actions">
                <button 
                  className="profile-btn" 
                  onClick={() => handleViewProfile(n.buyerId, n.buyerName)}
                >
                  👤 Profile
                </button>
                <button 
                  className="message-btn" 
                  onClick={() => handleMessageBuyer(n.buyerId, n.buyerName)}
                >
                  💬 Message
                </button>
                <button className="note-delete" onClick={() => handleDelete(n.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
