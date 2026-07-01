import type { RefObject } from 'react';

interface LoginTerminalProps {
  logs: string[];
  bootLogsCount: number;
  terminalEndRef: RefObject<HTMLDivElement | null>;
}

export default function LoginTerminal({
  logs,
  bootLogsCount,
  terminalEndRef,
}: LoginTerminalProps) {
  return (
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
          
          {logs.length < bootLogsCount + 3 && (
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
  );
}
