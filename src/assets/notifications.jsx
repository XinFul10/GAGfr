import React, { useEffect, useState } from 'react'
import './notifications.css'
import { getNotifications, clearNotifications, removeNotificationForSeller } from '../lib/notifications'
import { apiRequest } from '../lib/api'
import { buildImageUrl, resolveProductImage } from '../lib/images'

export default function Notifications({ user, onNavigateBack, onNavigateToProfile, onStartChat }) {
  const [notes, setNotes] = useState([])

  const getOrigin = () => (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api','')

  function aggregateNotifications(items) {
    const map = new Map()
    for (const n of items) {
      if (!n) continue
      const key = `${n.sellerId || ''}|${n.buyerId || ''}|${n.productId || ''}`
      const existing = map.get(key)
      if (!existing) {
        map.set(key, { ...n, quantity: Number(n.quantity || 1), totalCost: Number(n.totalCost != null ? n.totalCost : (Number(n.productPrice || 0) * Number(n.quantity || 1))) })
      } else {
        const addedQty = Number(n.quantity || 1)
        existing.quantity += addedQty
        const addedTotal = Number(n.totalCost != null ? n.totalCost : (Number(n.productPrice || 0) * addedQty))
        existing.totalCost = Number(existing.totalCost || 0) + addedTotal
        if (n.date && (!existing.date || new Date(n.date) > new Date(existing.date))) {
          existing.date = n.date
          existing.id = n.id
        }
        if (!existing.productImageUrl && (n.productImageUrl || n.productImage)) {
          existing.productImageUrl = n.productImageUrl || buildImageUrl(n.productImage)
        }
      }
    }
    return Array.from(map.values()).sort((a,b) => new Date(b.date) - new Date(a.date))
  }

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
            const origin = getOrigin()
            const normalized = res.notifications.map(n => ({
              sellerId: n.seller_id,
              buyerId: n.buyer_id,
              buyerName: n.buyer_name || n.buyer?.name || 'Unknown Buyer',
              productId: n.product_id,
              productName: n.product_name,
              productPrice: n.product_price,
              quantity: n.quantity || 1,
              totalCost: n.total_cost || ((parseFloat(n.product_price || 0) || 0) * (n.quantity || 1)),
              // Prefer a full URL if provided by the server, otherwise pass the storage path
              productImage: n.product_image,
              productImageUrl: n.product_image_url || (n.product_image ? buildImageUrl(n.product_image) : null),
              date: n.created_at,
              id: n.id,
              is_read: n.is_read
            }))
            const aggregated = aggregateNotifications(normalized)
            console.log('Normalized+aggregated notifications:', aggregated)
            setNotes(aggregated)
              if (aggregated.length > 0) console.log('Notification sample:', aggregated[0])
            // Attempt to backfill missing images from product endpoint
            backfillMissingImages(aggregated)
            return
          }
        } catch (e) {
          // API may be unavailable or unauthorized; fall back to localStorage
          console.warn('Failed to load server notifications, falling back to local storage', e)
        }
      }

      const all = getNotifications()
      const filtered = (user && user.id) ? all.filter(n => n.sellerId === user.id) : []
      const origin = getOrigin()
      const normalizedLocal = filtered.map(n => ({
        ...n,
        productImageUrl: n.productImageUrl || (n.productImage ? buildImageUrl(n.productImage) : null),
        quantity: Number(n.quantity || 1),
        totalCost: Number(n.totalCost != null ? n.totalCost : (Number(n.productPrice || 0) * Number(n.quantity || 1)))
      }))
      const aggregated = aggregateNotifications(normalizedLocal)
      console.log('Local notifications aggregated:', aggregated)
      setNotes(aggregated)
      backfillMissingImages(aggregated)
    }

    load()
    
    // Set up polling to check for new notifications every 5 seconds
    const interval = setInterval(load, 5000)
    
    return () => clearInterval(interval)
  }, [user])

  async function backfillMissingImages(currentNotes) {
    const missing = currentNotes.filter(n => !n.productImageUrl && n.productId)
    if (missing.length === 0) return
    const uniqueIds = Array.from(new Set(missing.map(n => n.productId)))
    try {
      const origin = getOrigin()
      const results = await Promise.all(uniqueIds.map(async (id) => {
        try {
          const res = await apiRequest(`/market/products/${id}`)
          const p = res.product || res || {}
          const img = p.image || p.product_image || p.image_path || null
          const url = img ? (img.startsWith('http') ? img : buildImageUrl(img)) : null
          return [id, url]
        } catch {
          return [id, null]
        }
      }))
      const idToUrl = Object.fromEntries(results)
      setNotes(prev => prev.map(n => (
        (!n.productImageUrl && idToUrl[n.productId]) ? { ...n, productImageUrl: idToUrl[n.productId] } : n
      )))
    } catch {}
  }

  //

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
                {n.productImageUrl ? (
                  <img 
                    src={n.productImageUrl}
                    alt={n.productName}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                      onError={(e) => {
                        try {
                          const origin = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api','')
                          const tryUrl = n.productImage || n.productImageUrl ? (n.productImage ? `${origin}/storage/${String(n.productImage).replace(/^\/+/, '')}` : null) : null
                          if (tryUrl && tryUrl !== e.target.src) {
                            e.target.onerror = null
                            e.target.src = tryUrl
                            return
                          }
                        } catch (err) {}
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                      }}
                  />
                ) : null}
                <div className="placeholder-image" style={{ display: n.productImageUrl ? 'none' : 'flex' }}>📦</div>
              </div>
              
              <div className="note-body">
                <div className="note-title">
                  <span className="buyer-name">{n.buyerName || 'Unknown Buyer'}</span> purchased your item
                </div>
                <div className="note-sub">{n.productName || 'an item'}</div>
                <div className="note-meta">
                  Qty: {Number(n.quantity || 1)}
                </div>
                <div className="note-price">
                  Item: ₱{parseFloat(n.productPrice || 0).toFixed(2)}
                </div>
                <div className="note-price">
                  Total: ₱{parseFloat(n.totalCost != null ? n.totalCost : (Number(n.productPrice || 0) * Number(n.quantity || 1))).toFixed(2)}
                </div>
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
