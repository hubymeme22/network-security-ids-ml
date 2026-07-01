import { useState } from 'react';
import LoginPanel from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('session_token'));
  const [user, setUser] = useState<string>(() => localStorage.getItem('username') || '');

  const handleLoginSuccess = (username: string) => {
    setUser(username);
    setIsLoggedIn(true);
    localStorage.setItem('username', username);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('session_token');
    if (token) {
      try {
        await fetch(`/auth/logout/${token}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Logout request failed:', err);
      }
      localStorage.removeItem('session_token');
      localStorage.removeItem('username');
    }
    setIsLoggedIn(false);
    setUser('');
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-100 font-sans">
      {isLoggedIn ? (
        <Dashboard username={user} onLogout={handleLogout} />
      ) : (
        <LoginPanel onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
