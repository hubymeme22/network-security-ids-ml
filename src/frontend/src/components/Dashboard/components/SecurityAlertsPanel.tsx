import { AlertOctagon, X, CheckCircle, ShieldCheck } from 'lucide-react';
import type { SecurityAlert } from '../../../types';

interface SecurityAlertsPanelProps {
  alerts: SecurityAlert[];
  blockedIps: string[];
  isolatedIps: string[];
  handleClearAlerts: () => void;
  handleBlockIp: (ip: string) => void;
  handleIsolateNode: (ip: string) => void;
  handleIgnoreAlert: (id: string) => void;
}

export default function SecurityAlertsPanel({
  alerts,
  blockedIps,
  isolatedIps,
  handleClearAlerts,
  handleBlockIp,
  handleIsolateNode,
  handleIgnoreAlert,
}: SecurityAlertsPanelProps) {
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-cyber-border/40 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-accent-rose" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Security Alerts</h2>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={handleClearAlerts}
              className="p-1 px-2 hover:bg-cyber-bg border border-cyber-border text-slate-500 hover:text-slate-300 rounded text-[9px] font-mono transition-colors cursor-pointer"
            >
              Clear Logs
            </button>
          )}
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
          {alerts.map((alert) => {
            const isMitigated = alert.status === 'Mitigated' || blockedIps.includes(alert.sourceIp) || isolatedIps.includes(alert.sourceIp);
            const isIgnored = alert.status === 'Ignored';
            if (isIgnored) return null;

            let severityColor = 'border-slate-500 bg-slate-500/10 text-slate-400';
            if (alert.severity === 'Critical') severityColor = 'border-accent-rose/30 bg-accent-rose/5 text-accent-rose';
            else if (alert.severity === 'High') severityColor = 'border-accent-amber/30 bg-accent-amber/5 text-accent-amber';
            else if (alert.severity === 'Medium') severityColor = 'border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan';

            return (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border flex flex-col justify-between gap-2.5 transition-all ${
                  isMitigated ? 'opacity-40 border-cyber-border bg-cyber-bg/30' : severityColor
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      alert.severity === 'Critical' ? 'bg-accent-rose animate-ping' : 'bg-accent-amber'
                    }`}></span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                      {alert.severity}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{alert.timestamp}</span>
                </div>

                <div>
                  <p className="text-xs font-semibold leading-snug">{alert.message}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">SOURCE: {alert.sourceIp}</p>
                </div>

                {/* Action buttons if active */}
                {!isMitigated && (
                  <div className="flex items-center gap-1.5 border-t border-cyber-border/20 pt-2">
                    <button
                      onClick={() => handleBlockIp(alert.sourceIp)}
                      className="flex-1 py-1 bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose border border-accent-rose/30 hover:border-accent-rose/50 rounded text-[9px] font-mono font-semibold transition-colors cursor-pointer uppercase text-center"
                    >
                      Block IP
                    </button>
                    <button
                      onClick={() => handleIsolateNode(alert.sourceIp)}
                      className="flex-1 py-1 bg-accent-amber/10 hover:bg-accent-amber/20 text-accent-amber border border-accent-amber/30 hover:border-accent-amber/50 rounded text-[9px] font-mono font-semibold transition-colors cursor-pointer uppercase text-center"
                    >
                      Isolate
                    </button>
                    <button
                      onClick={() => handleIgnoreAlert(alert.id)}
                      className="p-1 hover:bg-cyber-bg border border-cyber-border text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                      title="Ignore Alert"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {isMitigated && (
                  <div className="flex items-center gap-1 text-[9px] font-mono text-accent-emerald mt-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>MITIGATED & FIREWALL UPDATED</span>
                  </div>
                )}
              </div>
            );
          })}

          {alerts.filter(a => a.status !== 'Ignored').length === 0 && (
            <div className="py-16 text-center text-slate-500 font-mono border border-dashed border-cyber-border/40 rounded-lg flex flex-col items-center justify-center p-4">
              <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs">No active threat alerts in this session.</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[160px] leading-relaxed">
                Toggle Attack Simulation to test mitigation routines.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Attacks Metrics Panel */}
      <div className="mt-4 pt-4 border-t border-cyber-border/40">
        <div className="p-3 bg-cyber-bg/50 border border-cyber-border/40 rounded-lg">
          <h4 className="text-[10px] font-bold text-white font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan"></span>
            <span>Mitigation Rules Status</span>
          </h4>
          <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
            <div className="flex justify-between">
              <span>Blocked IP rules:</span>
              <span className="text-white font-bold">{blockedIps.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Isolated segments:</span>
              <span className="text-white font-bold">{isolatedIps.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
