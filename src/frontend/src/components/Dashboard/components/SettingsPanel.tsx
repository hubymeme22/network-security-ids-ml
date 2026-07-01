import { Settings } from 'lucide-react';

interface SettingsPanelProps {
  sensitivity: number;
  setSensitivity: (val: number) => void;
  blockedIpsCount: number;
  onClearBlockedIps: () => void;
}

export default function SettingsPanel({
  sensitivity,
  setSensitivity,
  blockedIpsCount,
  onClearBlockedIps,
}: SettingsPanelProps) {
  return (
    <div className="col-span-full bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-xl animate-fade-in flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-cyber-bg border border-cyber-border mt-0.5 text-accent-primary">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">SentinelCore Configurations</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Adjust detection parameters, configure WebSocket sockets, and toggle mock telemetry properties.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
        <div className="flex-1 min-w-[200px] md:w-48">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Detection Sensitivity</span>
            <span className="text-xs text-white font-semibold font-mono">{sensitivity}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="95"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full h-1 bg-cyber-bg border border-cyber-border rounded-lg appearance-none cursor-pointer accent-accent-primary"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="block text-slate-500 font-mono">BLOCKED HOSTS</span>
            <span className="text-white font-semibold font-mono">{blockedIpsCount} rules active</span>
          </div>
          {blockedIpsCount > 0 && (
            <button
              onClick={onClearBlockedIps}
              className="p-1 px-2 border border-cyber-border rounded text-[10px] text-accent-rose hover:bg-accent-rose/10 transition-colors cursor-pointer"
            >
              Clear Rules
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
