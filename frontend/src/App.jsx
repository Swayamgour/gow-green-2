import { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { getToken, getUser, clearSession } from './services/auth.service'
import './App.css'

function App() {
  const [user, setUser] = useState(() => getToken() ? getUser() : null)

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
  }

  return (
    <>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </>
  )
}

export default App
