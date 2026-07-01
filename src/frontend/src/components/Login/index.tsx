import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Shield } from 'lucide-react';
import LoginForm from './components/LoginForm';
import LoginTerminal from './components/LoginTerminal';

interface LoginPanelProps {
  onLoginSuccess: (username: string) => void;
}

const bootLogs = [
  'SYSTEM: Initializing security handshake...',
  'NET: Connecting to authentication gateway (Port 443)...',
  'TLS: Handshake successful. TLS_AES_256_GCM_SHA384 active.',
  'SEC: Requesting authorization token...',
  'DB: Validating cryptographic signature...',
];

export default function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      try {
        terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        console.warn('scrollIntoView failed:', err);
      }
    }
  }, [logs]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Clearance credentials cannot be empty.');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);
    setLogs([]);

    // Start authenticating against the backend
    let authResult: { success: boolean; session?: string | null; error?: string } | null = null;

    fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Authentication error.');
        }
        return res.json();
      })
      .then(data => {
        authResult = data;
      })
      .catch(err => {
        authResult = { success: false, error: err.message || 'Connection refused.' };
      });

    // Start terminal boot sequence
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < bootLogs.length) {
        const logText = bootLogs[currentLogIndex];
        setLogs(prev => [...prev, logText]);
        currentLogIndex++;
      } else {
        clearInterval(interval);

        // Wait for authResult if it hasn't resolved yet, then proceed
        const checkAuthAndComplete = () => {
          if (authResult === null) {
            setTimeout(checkAuthAndComplete, 100);
            return;
          }

          if (authResult.success && authResult.session) {
            // Save token
            localStorage.setItem('session_token', authResult.session);

            setLogs(prev => [
              ...prev,
              'ACCESS: Granted.',
              'SYS: Loading SentinelCore dashboard...',
              'SYS: Session established successfully.'
            ]);

            setTimeout(() => {
              onLoginSuccess(username);
            }, 1000);
          } else {
            const displayError = authResult.error || 'Invalid credentials or insufficient security clearance.';
            setLogs(prev => [
              ...prev,
              'ACCESS: DENIED.',
              `ERR: ${displayError}`,
              'SYS: Terminating connection.'
            ]);
            setTimeout(() => {
              setIsVerifying(false);
              setErrorMsg(displayError);
            }, 1200);
          }
        };

        setTimeout(checkAuthAndComplete, 400);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg p-4 relative font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#14192b_1px,transparent_1px),linear-gradient(to_bottom,#14192b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-md relative">
        {/* Glow behind panel (Subtle, professional) */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary to-accent-cyan rounded-xl blur-md opacity-20 pointer-events-none"></div>

        {/* Main Card */}
        <div className="relative glassmorphic border border-cyber-border rounded-xl p-8 shadow-2xl overflow-hidden bg-cyber-card/90">

          {/* Futuristic laser scanner line when authenticating */}
          {isVerifying && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-primary shadow-[0_0_10px_#6366f1] animate-scan z-10 pointer-events-none"></div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-cyber-card border border-cyber-border mb-4 text-accent-primary">
              <Shield className="w-8 h-8 animate-pulse-slow" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              ML<span className="text-accent-primary">IDS</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
              Intrusion Detection Gateway
            </p>
          </div>

          {!isVerifying ? (
            <LoginForm
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              errorMsg={errorMsg}
              onSubmit={handleSubmit}
            />
          ) : (
            <LoginTerminal
              logs={logs}
              bootLogsCount={bootLogs.length}
              terminalEndRef={terminalEndRef}
            />
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-4 border-t border-cyber-border/40 text-center">
            <p className="text-[10px] text-slate-500 font-mono">
              MLIDS v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
