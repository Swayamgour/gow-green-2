import { useEffect, useState } from 'react';
import { loginUser } from '../services/auth.service';
import './Login.css';

function Login({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const logoutMsg = sessionStorage.getItem('gg_logout_msg');
    if (logoutMsg) {
      setLogoutMessage(logoutMsg);
      sessionStorage.removeItem('gg_logout_msg');
      setTimeout(() => setLogoutMessage(''), 3000);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) { setError('Please fill in all fields'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return; }

    setLoading(true);
    try {
      const data = await loginUser(email, password);
      console.log('Login response:', JSON.stringify(data));
     const userName = data.name || 'User';
const userRole = data.role === 'admin' ? 'Admin' : 'Sales Executive';
      sessionStorage.setItem('gg_login_msg', `Welcome back, ${userName}! Logged in as ${userRole}`);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🌿</div>
          <h1>Glow Green CRM</h1>
          <p>Sign in to your account</p>
        </div>

        {logoutMessage && (
          <div style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {logoutMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email" disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password" disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <span className="login-spinner" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* <div className="login-footer">
          <p>Contact your admin to get access</p>
        </div> */}
      </div>
    </div>
  );
}

export default Login;