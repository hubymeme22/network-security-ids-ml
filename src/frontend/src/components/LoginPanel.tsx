import React, { useState, useEffect, useRef } from 'react';
import { Shield, Terminal, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginPanelProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const bootLogs = [
    'SYSTEM: Initializing security handshake...',
    'NET: Connecting to authentication gateway (Port 443)...',
    'TLS: Handshake successful. TLS_AES_256_GCM_SHA384 active.',
    'SEC: Requesting authorization token...',
    'DB: Validating cryptographic signature...',
  ];

  useEffect(() => {
    if (terminalEndRef.current) {
      try {
        terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        console.warn('scrollIntoView failed:', err);
      }
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Clearance credentials cannot be empty.');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);
    setLogs([]);

    // Start terminal boot sequence
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < bootLogs.length) {
        const logText = bootLogs[currentLogIndex];
        setLogs(prev => [...prev, logText]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Final authentication check
        setTimeout(() => {
          if (username === 'admin' && password === 'admin') {
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
            setLogs(prev => [
              ...prev,
              'ACCESS: DENIED.',
              'ERR: Invalid credentials or insufficient security clearance.',
              'SYS: Terminating connection.'
            ]);
            setTimeout(() => {
              setIsVerifying(false);
              setErrorMsg('Invalid username or password. (Hint: Use admin/admin)');
            }, 1200);
          }
        }, 800);
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
              SENTINEL<span className="text-accent-primary">CORE</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
              Intrusion Detection Gateway
            </p>
          </div>

          {!isVerifying ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose text-xs flex items-start gap-2 animate-pulse-slow">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Clearance ID (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-primary transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Access Key (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-cyber-bg border border-cyber-border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-primary transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-accent-primary hover:bg-accent-primary-hover text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all cursor-pointer font-mono uppercase tracking-widest text-center"
                >
                  Request Clearance
                </button>
              </div>
            </form>
          ) : (
            /* Terminal boot logging layout */
            <div className="space-y-4">
              <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 font-mono text-[11px] leading-relaxed text-slate-300 h-48 overflow-y-auto flex flex-col justify-start">
                <div className="space-y-1.5">
                  {logs.map((log, index) => {
                    let colorClass = 'text-slate-300';
                    if (log.includes('OK') || log.includes('ACCESS: Granted') || log.includes('successful')) {
                      colorClass = 'text-accent-emerald';
                    } else if (log.includes('ERR') || log.includes('ACCESS: DENIED') || log.includes('Terminating')) {
                      colorClass = 'text-accent-rose';
                    } else if (log.includes('SYSTEM') || log.includes('SYS')) {
                      colorClass = 'text-accent-cyan';
                    }
                    return (
                      <div key={index} className={`${colorClass} whitespace-pre-wrap`}>
                        {log}
                      </div>
                    );
                  })}
                  
                  {logs.length < bootLogs.length + 3 && (
                    <div className="text-accent-primary flex items-center gap-1">
                      <span>_</span>
                      <span className="w-1.5 h-3 bg-accent-primary animate-terminal-cursor"></span>
                    </div>
                  )}
                </div>
                <div ref={terminalEndRef} />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse-slow">
                  Clearance Check In Progress
                </p>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-4 border-t border-cyber-border/40 text-center">
            <p className="text-[10px] text-slate-500 font-mono">
              SentinelCore v1.0.0 // SECURE NODE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
