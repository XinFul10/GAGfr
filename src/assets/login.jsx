import React from 'react'
import './login.css'
import logo from './agriconnect.svg'

export default function Login() {
  return (
    <div className="container" style={{maxWidth: 420}}>
      <div className="header">
        <img src={logo} alt="logo" />
        <h1>Hi There</h1>
        <h2>Welcome to AgriConnect!</h2>
      </div>

      <div className="main">
        <button className="btn btn-primary">Sign in</button>
        <button className="btn btn-outline">Create account</button>
      </div>
    </div>
  )
}