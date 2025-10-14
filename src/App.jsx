import { useEffect, useState } from 'react'
import Login from './assets/login.jsx'
import Dashboard from './assets/Dashboard.jsx'
import Notifications from './assets/notifications.jsx'
import Market from './assets/market.jsx'
import UserList from './assets/UserList.jsx'
import UserProfile from './assets/UserProfile.jsx'
import MyProfile from './assets/MyProfile.jsx'
import { clearSession, getUser } from './lib/api'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Cart from './assets/cart.jsx'
import Calendar from './assets/calendar.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedUserName, setSelectedUserName] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const u = getUser()
    if (u) {
      setUser(u)
      setIsLoggedIn(true)
    }
  }, [])

  function handleSignIn() {
    const u = getUser()
    setUser(u)
    setIsLoggedIn(true)
  }

  function handleLogout() {
    clearSession()
    setUser(null)
    setIsLoggedIn(false)
    setCurrentPage('dashboard')
    navigate('/')
  }

  function handleNavigateToMarket() {
    setCurrentPage('market')
  }

  function handleNavigateToNotifications() {
    setCurrentPage('notifications')
  }

  function handleNavigateToUserList() {
    setCurrentPage('userlist')
  }

  function handleNavigateToMyProfile() {
    setCurrentPage('myprofile')
  }

  function handleNavigateBack() {
    setCurrentPage('dashboard')
    setSelectedUserId(null)
    setSelectedUserName(null)
  }

  function handleNavigateToProfile(userId, userName) {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setCurrentPage('profile')
  }

  function handleStartChat(chatUser) {
    // For now, we'll just show an alert. In a real app, this would open a chat interface
    alert(`Starting chat with ${chatUser.name} (ID: ${chatUser.id})`)
    // You could implement a chat interface here
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        currentPage === 'market' ? (
          <Market user={user} onNavigateBack={handleNavigateBack} />
        ) : currentPage === 'notifications' ? (
          <Notifications 
            user={user} 
            onNavigateBack={handleNavigateBack}
            onNavigateToProfile={handleNavigateToProfile}
            onStartChat={handleStartChat}
          />
        ) : currentPage === 'userlist' ? (
          <UserList onNavigateBack={handleNavigateBack} />
        ) : currentPage === 'profile' ? (
          <UserProfile 
            userId={selectedUserId}
            userName={selectedUserName}
            onNavigateBack={handleNavigateBack}
            onStartChat={handleStartChat}
          />
        ) : currentPage === 'myprofile' ? (
          <MyProfile onNavigateBack={handleNavigateBack} />
        ) : (
          <Routes>
            <Route
              path="/"
              element={(
                <Dashboard
                  user={user}
                  onLogout={handleLogout}
                  onNavigateToMarket={handleNavigateToMarket}
                  onNavigateToNotifications={handleNavigateToNotifications}
                  onNavigateToUserList={handleNavigateToUserList}
                  onNavigateToMyProfile={handleNavigateToMyProfile}
                />
              )}
            />
            <Route
              path="/calendar"
              element={<Calendar user={user} />}
            />
            <Route
              path="/cart"
              element={<Cart />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )
      ) : (
        <Login onSignIn={handleSignIn} />
      )}
    </div>
  )
}

export default App