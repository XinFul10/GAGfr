import React, { useState, useEffect, useRef } from 'react'
import './dashboard.css'
import './notification-badge.css'
import { useNavigate } from 'react-router-dom'

export default function Dashboard({ user, onLogout, onNavigateToMarket, onNavigateToNotifications, onNavigateToUserList }) {
  const navigate = useNavigate()
  const goCalendar = () => navigate('/calendar')
  const [showMessagePanel, setShowMessagePanel] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [conversations, setConversations] = useState([])
  const [notificationCount, setNotificationCount] = useState(0)
  const messagePanelRef = useRef(null)

  // Load conversations from notifications
  useEffect(() => {
    const loadConversations = async () => {
      if (user && user.id) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/notifications`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.notifications && Array.isArray(data.notifications)) {
              // Convert notifications to conversations
              const conversationMap = new Map()
              
              data.notifications.forEach(notification => {
                const buyerId = notification.buyer_id
                const buyerName = notification.buyer_name || notification.buyer?.name || 'Unknown Buyer'
                
                if (!conversationMap.has(buyerId)) {
                  conversationMap.set(buyerId, {
                    id: buyerId,
                    customerName: buyerName,
                    customerAvatar: buyerName.charAt(0).toUpperCase(),
                    customerId: buyerId,
                    messages: [],
                    unread: 0,
                    lastMessageTime: notification.created_at
                  })
                }
                
                // Add purchase message
                const conversation = conversationMap.get(buyerId)
                conversation.messages.push({
                  id: `purchase-${notification.id}`,
                  sender: 'customer',
                  text: `Purchased: ${notification.product_name}`,
                  time: new Date(notification.created_at).toLocaleString()
                })
                conversation.unread++
              })
              
              setConversations(Array.from(conversationMap.values()))
            }
          }
        } catch (error) {
          console.error('Failed to load conversations:', error)
        }
      }
    }
    
    loadConversations()
  }, [user])

  // Load notification count
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (user && user.id) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/notifications`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.notifications && Array.isArray(data.notifications)) {
              const unreadCount = data.notifications.filter(n => !n.is_read).length
              setNotificationCount(unreadCount)
            }
          }
        } catch (error) {
          console.error('Failed to load notification count:', error)
        }
      }
    }
    
    loadNotificationCount()
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotificationCount, 10000)
    
    return () => clearInterval(interval)
  }, [user])

  // Close message panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if clicking on the message button
      if (event.target.closest('.message-btn')) {
        return
      }
      
      if (messagePanelRef.current && !messagePanelRef.current.contains(event.target)) {
        setShowMessagePanel(false)
      }
    }

    if (showMessagePanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMessagePanel])

  const handleSendReply = (conversationId) => {
    if (!replyText.trim()) return

    const newMessage = {
      id: Date.now(),
      sender: 'you',
      text: replyText.trim(),
      time: 'now'
    }

    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessageTime: 'now',
            unread: 0
          }
        : conv
    ))

    setReplyText('')
  }

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    // Mark messages as read
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unread: 0 }
        : conv
    ))
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="welcome-card">
          <div className="welcome-left">
            <div className="avatar">H</div>
            <div>
              <div style={{fontWeight: 700}}>Welcome!</div>
              <div style={{fontSize: 12}}>{getDisplayName(user)}</div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className={`message-btn ${showMessagePanel ? 'active' : ''}`}
              title="Customer Messages" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMessagePanel(!showMessagePanel)
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMessagePanel(!showMessagePanel)
              }}
            >
              💬
            </button>
            <button className="notif-btn" title="Notifications" onClick={onNavigateToNotifications}>
              🔔
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
          </div>
        </div>

        {showMessagePanel && (
          <div className="message-panel" ref={messagePanelRef}>
            {!selectedConversation ? (
              // Conversation List View
              <>
                <div className="message-panel-header">
                  <h3>Customer Messages</h3>
                  <button className="close-btn" onClick={() => setShowMessagePanel(false)}>×</button>
                </div>
                <div className="chat-conversations">
                  {conversations.length === 0 ? (
                    <div className="empty-conversations">
                      <p>No customer messages yet</p>
                      <p>Messages will appear here when customers purchase your products</p>
                    </div>
                  ) : (
                    conversations.map(conversation => (
                      <div 
                        key={conversation.id} 
                        className="conversation-item"
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="conversation-header">
                          <div className="customer-avatar">{conversation.customerAvatar}</div>
                          <div className="customer-info">
                            <div className="customer-name">{conversation.customerName}</div>
                            <div className="last-message-time">{new Date(conversation.lastMessageTime).toLocaleString()}</div>
                          </div>
                          {conversation.unread > 0 && <div className="unread-badge">{conversation.unread}</div>}
                        </div>
                        <div className="messages-preview">
                          {conversation.messages.slice(-2).map(message => (
                            <div key={message.id} className={`message-preview ${message.sender}`}>
                              <span className="message-text">{message.text}</span>
                              <span className="message-time">{message.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              // Detailed Conversation View
              <>
                <div className="message-panel-header">
                  <button className="back-btn" onClick={() => setSelectedConversation(null)}>←</button>
                  <h3>{selectedConversation.customerName}</h3>
                  <button className="close-btn" onClick={() => setShowMessagePanel(false)}>×</button>
                </div>
                <div className="conversation-detail">
                  <div className="messages-container">
                    {selectedConversation.messages.map(message => (
                      <div key={message.id} className={`message-bubble ${message.sender}`}>
                        <div className="message-content">{message.text}</div>
                        <div className="message-timestamp">{message.time}</div>
                      </div>
                    ))}
                  </div>
                  <div className="reply-section">
                    <div className="reply-input-container">
                      <input
                        type="text"
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendReply(selectedConversation.id)
                          }
                        }}
                        className="reply-input"
                      />
                      <button 
                        className="send-btn"
                        onClick={() => handleSendReply(selectedConversation.id)}
                        disabled={!replyText.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="dash-body">
        <div className="section-title">Category</div>
        <div className="cat-grid">
          <CategoryItem label="Market" icon="🛒" onClick={onNavigateToMarket} />
          <CategoryItem label="Weather" icon="📅" />
          <CategoryItem label="Calendar" icon="🗓️" onClick={goCalendar} />
          <CategoryItem label="Notes & Tips" icon="✏️" />
          <CategoryItem label="Users" icon="👥" onClick={onNavigateToUserList} />
        </div>

        <div className="section-title">Farm Life</div>
        <div className="farm-grid">
          <img className="farm-photo" alt="farm" />
          <img className="farm-photo" alt="farm" />
          <img className="farm-photo" alt="farm" />
        </div>

        <div className="section-title">Recommended</div>
        <div className="cards-row">
          <div className="card-tile">Recommendation A</div>
          <div className="card-tile">Recommendation B</div>
        </div>

        <div style={{marginTop: 16, display: 'flex', justifyContent: 'center'}}>
          <button className="btn btn-outline" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <nav className="tabbar">
        <div className="tabs">
          <div className="tab"><div className="ico">🏠</div>Home</div>
          <div className="tab"><div className="ico">🔎</div>Search</div>
          <div className="tab"><div className="ico">👤</div>Profile</div>
        </div>
      </nav>
    </div>
  )
}

function CategoryItem({ icon, label, onClick }) {
  return (
    <div className="cat-item" onClick={onClick}>
      <div className="cat-icon" aria-hidden>{icon}</div>
      <div className="cat-label">{label}</div>
    </div>
  )
}

// Helper: determine the display name from user object with common fallback keys
function getDisplayName(user) {
  if (!user) return 'Guest'
  return user.fullName || user.full_name || user.name || user.displayName || 'Guest'
}


