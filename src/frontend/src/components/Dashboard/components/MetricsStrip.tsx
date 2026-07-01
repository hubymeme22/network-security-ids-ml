import { Server, ShieldAlert, ShieldCheck, Cpu, Activity, AlertTriangle } from 'lucide-react';
import type { SystemMetrics } from '../../../types';

interface MetricsStripProps {
  isUnderAttack: boolean;
  metrics: SystemMetrics;
  blockedIpsCount: number;
}

export default function MetricsStrip({
  isUnderAttack,
  metrics,
  blockedIpsCount,
}: MetricsStripProps) {
  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Live Status */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Security Status</span>
          <Server className="w-4 h-4 text-slate-500" />
        </div>
        <div className="my-4 flex items-baseline gap-2">
          {isUnderAttack ? (
            <div className="text-accent-rose flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span className="text-xl font-bold tracking-tight font-mono">UNDER ATTACK</span>
            </div>
          ) : (
            <div className="text-accent-emerald flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-xl font-bold tracking-tight font-mono">SECURED</span>
            </div>
          )}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          FIREWALL STATE: <span className={metrics.firewallStatus === 'Active' ? 'text-accent-emerald' : 'text-accent-rose'}>{metrics.firewallStatus}</span>
        </div>
      </div>

      {/* Card 2: CPU Utilization */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Inference Node CPU</span>
          <Cpu className="w-4 h-4 text-slate-500" />
        </div>
        <div className="my-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">{metrics.cpuUsage}</span>
            <span className="text-xs text-slate-500 font-mono">%</span>
          </div>
          {/* Custom micro progress bar */}
          <div className="w-full bg-cyber-bg h-1.5 rounded-full overflow-hidden border border-cyber-border mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.cpuUsage > 80 ? 'bg-accent-rose' : metrics.cpuUsage > 50 ? 'bg-accent-amber' : 'bg-accent-primary'
              }`}
              style={{ width: `${metrics.cpuUsage}%` }}
            ></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          SYSTEM MEMORY: {metrics.memoryUsage}%
        </div>
      </div>

      {/* Card 3: Bandwidth */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Network Bandwidth</span>
          <Activity className="w-4 h-4 text-slate-500 animate-pulse" />
        </div>
        <div className="my-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-mono block">INCOMING</span>
            <span className="text-lg font-bold text-white font-mono">{metrics.bandwidthIn} <span className="text-xs font-normal text-slate-500">Mbps</span></span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono block">OUTGOING</span>
            <span className="text-lg font-bold text-white font-mono">{metrics.bandwidthOut} <span className="text-xs font-normal text-slate-500">Mbps</span></span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan"></div>
          <span>Interface capture rate active</span>
        </div>
      </div>

      {/* Card 4: Security Alerts */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Active Threats</span>
          <AlertTriangle className="w-4 h-4 text-slate-500" />
        </div>
        <div className="my-4 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold tracking-tight font-mono ${metrics.activeThreats > 0 ? 'text-accent-rose' : 'text-white'}`}>
            {metrics.activeThreats}
          </span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-mono">unresolved</span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          BLOCKED IPs: {blockedIpsCount} active rules
        </div>
      </div>
    </div>
  );
}
