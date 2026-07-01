import { useState } from 'react';
import LoginPanel from './components/LoginPanel';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string>('');

  const handleLoginSuccess = (username: string) => {
    setUser(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
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
