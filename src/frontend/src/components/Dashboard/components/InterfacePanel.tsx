import React from 'react';
import { Wifi, Trash2 } from 'lucide-react';

interface InterfacePanelProps {
  selectedInterface: string;
  setSelectedInterface: (val: string) => void;
  interfaces: string[];
  blockedIps: string[];
  isolatedIps: string[];
  setBlockedIps: React.Dispatch<React.SetStateAction<string[]>>;
  setIsolatedIps: React.Dispatch<React.SetStateAction<string[]>>;
  triggerToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function InterfacePanel({
  selectedInterface,
  setSelectedInterface,
  interfaces,
  blockedIps,
  isolatedIps,
  setBlockedIps,
  setIsolatedIps,
  triggerToast,
}: InterfacePanelProps) {
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono mb-3 flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-accent-cyan" />
          <span>NIC Capture Interfaces</span>
        </h3>
        
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 font-mono uppercase block">Select network card</label>
          <select
            value={selectedInterface}
            onChange={(e) => {
              setSelectedInterface(e.target.value);
              triggerToast(`Switched target capture device to ${e.target.value}.`);
            }}
            className="w-full p-2 bg-cyber-bg border border-cyber-border rounded-lg text-white font-mono text-xs focus:outline-none focus:border-accent-primary"
          >
            {interfaces.map((intf) => (
              <option key={intf} value={intf}>
                {intf}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 pt-4 border-t border-cyber-border/40 space-y-3">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Blocking Rules ({blockedIps.length})</span>
          <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
            {blockedIps.map((ip) => (
              <div key={ip} className="flex items-center justify-between p-1.5 px-2 bg-cyber-bg border border-cyber-border/40 rounded font-mono text-[10px]">
                <span className="text-accent-rose font-semibold">{ip}</span>
                <button
                  onClick={() => {
                    setBlockedIps(prev => prev.filter(blocked => blocked !== ip));
                    triggerToast(`IP ${ip} removed from blocked list.`);
                  }}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {blockedIps.length === 0 && (
              <div className="text-center text-slate-500 italic text-[10px] py-2 font-mono">
                No hosts blocked.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-cyber-border/40 space-y-3">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Isolated Node rules ({isolatedIps.length})</span>
          <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
            {isolatedIps.map((ip) => (
              <div key={ip} className="flex items-center justify-between p-1.5 px-2 bg-cyber-bg border border-cyber-border/40 rounded font-mono text-[10px]">
                <span className="text-accent-amber font-semibold">{ip}</span>
                <button
                  onClick={() => {
                    setIsolatedIps(prev => prev.filter(iso => iso !== ip));
                    triggerToast(`Node ${ip} reconnected.`);
                  }}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {isolatedIps.length === 0 && (
              <div className="text-center text-slate-500 italic text-[10px] py-2 font-mono">
                No nodes isolated.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
