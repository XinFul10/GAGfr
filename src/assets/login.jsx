import React, { useState } from 'react'
import './login.css'
import { apiRequest, setSession } from '../lib/api'
import logo from './agriconnect.svg'

export default function Login({ onSignIn }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'complete'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pendingUserId, setPendingUserId] = useState(null)
  const [pendingEmail, setPendingEmail] = useState('')
  const isSignup = mode === 'signup'
  const isComplete = mode === 'complete'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password || (isSignup && (!name || !confirm))) {
      alert('Please fill in all required fields.')
      return
    }
    if (isSignup && password !== confirm) {
      alert('Passwords do not match.')
      return
    }
    try {
      const path = isSignup ? '/auth/signup' : '/auth/login'
      const body = isSignup ? { name, email, password } : { email, password }
      console.log('Sending request to:', path, 'with body:', body)
      const response = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(body)
      })
      
      if (response.requires_completion) {
        // User needs to complete registration
        setPendingUserId(response.user_id)
        setPendingEmail(response.email || email)
        setMode('complete')
        return
      }
      
      // Normal login/signup success
      setSession(response.token, response.user)
      onSignIn?.()
    } catch (err) {
      console.error('Authentication error:', err)
      if (err.data && err.data.requires_completion) {
        // Handle login attempt with inactive account
        setPendingUserId(err.data.user_id)
        setPendingEmail(email)
        setMode('complete')
        return
      }
      alert(err.message || 'Authentication failed')
    }
  }

  async function handleCompleteRegistration() {
    try {
      await apiRequest('/auth/complete-registration', {
        method: 'POST',
        body: JSON.stringify({ user_id: pendingUserId })
      })
      
      alert('Registration completed successfully! Please log in with your credentials.')
      
      // Reset form and go back to login
      setMode('login')
      setPendingUserId(null)
      setPendingEmail('')
      setEmail('')
      setPassword('')
    } catch (err) {
      console.error('Registration completion error:', err)
      alert(err.message || 'Failed to complete registration')
    }
  }

  return (
    <div className="container" style={{maxWidth: 420}}>
      <div className="header">
        <img src={logo} alt="logo" />
        <h1>Hi There</h1>
        <h2>Welcome to AgriConnect!</h2>
      </div>

      <div className="main">
        {isComplete ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center'}}>
            <h3>Complete Your Registration</h3>
            <p>Welcome to AgriConnect! Your account has been created for <strong>{pendingEmail}</strong></p>
            <p>Click the button below to activate your account. After activation, you'll be redirected to the login page.</p>
            <button className="btn btn-primary" onClick={handleCompleteRegistration}>
              Complete Registration
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setMode('login')
                setPendingUserId(null)
                setPendingEmail('')
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {isSignup && (
              <input
                className="input"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {isSignup && (
              <input
                className="input"
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            )}
            <button className="btn btn-primary" type="submit">
              {isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>
        )}

        {!isComplete && (
          <button
            className="btn btn-outline"
            onClick={() => setMode(isSignup ? 'login' : 'signup')}
          >
            {isSignup ? 'Have an account? Sign in' : 'Create account'}
          </button>
        )}
      </div>
    </div>
  )
}