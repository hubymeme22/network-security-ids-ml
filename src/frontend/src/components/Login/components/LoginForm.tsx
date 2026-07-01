import { useState } from 'react';
import type { FormEvent } from 'react';
import { Terminal, KeyRound, Eye, EyeOff } from 'lucide-react';
import Alert from '../../../core_components/Alert';

interface LoginFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  errorMsg: string;
  onSubmit: (e: FormEvent) => void;
}

export default function LoginForm({
  username,
  setUsername,
  password,
  setPassword,
  errorMsg,
  onSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {errorMsg && (
        <Alert message={errorMsg} type="error" />
      )}

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 font-mono mb-2">
          Username
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
          Password
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
          Login
        </button>
      </div>
    </form>
  );
}
