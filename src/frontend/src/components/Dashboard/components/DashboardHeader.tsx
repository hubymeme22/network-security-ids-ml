import { Shield, ShieldAlert, Radio, Settings, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  username: string;
  selectedInterface: string;
  isUnderAttack: boolean;
  setIsUnderAttack: (val: boolean) => void;
  isLiveMode: boolean;
  setIsLiveMode: (val: boolean) => void;
  webSocketStatus: 'disconnected' | 'connecting' | 'connected';
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  onLogout: () => void;
  triggerToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function DashboardHeader({
  username,
  selectedInterface,
  isUnderAttack,
  setIsUnderAttack,
  isLiveMode,
  setIsLiveMode,
  webSocketStatus,
  showSettings,
  setShowSettings,
  onLogout,
  triggerToast,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-cyber-border bg-cyber-card/80 sticky top-0 z-30 glassmorphism px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg border border-cyber-border bg-cyber-bg">
          <Shield className="w-6 h-6 text-accent-primary animate-pulse-slow" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-widest text-white font-mono flex items-center gap-2">
            SENTINEL<span className="text-accent-primary">CORE</span>
            <span className="text-[10px] py-0.5 px-2 bg-cyber-border text-slate-400 rounded-full font-sans uppercase font-normal tracking-normal border border-cyber-border">
              {selectedInterface || 'lo'}
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            SECURE DEPLOYMENT // SESSION: {username}@sentinel
          </p>
        </div>
      </div>

      {/* Global Controls */}
      <div className="flex items-center gap-3">
        {/* Under Attack Simulation Toggle */}
        <button
          onClick={() => {
            setIsUnderAttack(!isUnderAttack);
            triggerToast(
              !isUnderAttack 
                ? 'CRITICAL ALERT: Simulating network-wide DDoS and port scan anomaly.'
                : 'Simulation normalized. Under attack mode disabled.',
              !isUnderAttack ? 'error' : 'info'
            );
          }}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            isUnderAttack 
              ? 'bg-accent-rose/20 border-accent-rose text-accent-rose animate-pulse'
              : 'bg-cyber-bg border-cyber-border text-slate-400 hover:text-white hover:border-accent-rose/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{isUnderAttack ? 'ATTACK SIMULATION ON' : 'SIMULATE ATTACK'}</span>
        </button>

        {/* Live vs Mock Switch */}
        <div className="flex items-center bg-cyber-bg border border-cyber-border rounded-lg p-0.5">
          <button
            onClick={() => {
              setIsLiveMode(false);
              triggerToast('Switched to simulated sandbox mode.');
            }}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
              !isLiveMode 
                ? 'bg-cyber-card border border-cyber-border text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mock Mode
          </button>
          <button
            onClick={() => {
              setIsLiveMode(true);
            }}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              isLiveMode 
                ? 'bg-accent-primary/20 border border-accent-primary/30 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className={`w-3 h-3 ${isLiveMode ? 'text-accent-cyan animate-pulse' : 'text-slate-500'}`} />
            <span>Live Backend</span>
          </button>
        </div>

        {/* Connection Status indicator */}
        {isLiveMode && (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              webSocketStatus === 'connected' 
                ? 'bg-accent-emerald shadow-[0_0_8px_#10b981]' 
                : webSocketStatus === 'connecting'
                ? 'bg-accent-amber animate-pulse'
                : 'bg-accent-rose'
            }`}></span>
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
              {webSocketStatus}
            </span>
          </div>
        )}

        {/* Settings gear */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            showSettings 
              ? 'bg-cyber-card border-accent-primary text-accent-primary' 
              : 'border-cyber-border hover:bg-cyber-card text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-lg border border-cyber-border bg-cyber-bg hover:bg-accent-rose/10 hover:border-accent-rose/30 text-slate-400 hover:text-accent-rose transition-colors cursor-pointer"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
