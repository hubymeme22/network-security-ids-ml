import { Database } from 'lucide-react';
import type { NetworkPacket } from '../../../types';

interface PacketStreamTableProps {
  packets: NetworkPacket[];
  packetFilter: 'all' | 'threats' | 'normal';
  setPacketFilter: (filter: 'all' | 'threats' | 'normal') => void;
  setSelectedPacket: (packet: NetworkPacket) => void;
  interfaces: string[];
  blockedIps: string[];
  isolatedIps: string[];
}

export default function PacketStreamTable({
  packets,
  packetFilter,
  setPacketFilter,
  setSelectedPacket,
  interfaces,
  blockedIps,
  isolatedIps,
}: PacketStreamTableProps) {
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
      {/* Headers and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-accent-cyan" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Live ML Inference Stream</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Filter</span>
          <div className="bg-cyber-bg border border-cyber-border rounded-lg p-0.5 flex">
            {(['all', 'threats', 'normal'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPacketFilter(filter)}
                className={`px-2.5 py-1 text-[10px] rounded-md font-mono uppercase transition-all cursor-pointer ${
                  packetFilter === filter 
                    ? 'bg-cyber-card border border-cyber-border text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Packet Table */}
      <div className="border border-cyber-border/40 rounded-lg overflow-hidden bg-cyber-bg/30">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full border-collapse text-left font-mono text-[11px]">
            <thead className="sticky top-0 bg-cyber-card border-b border-cyber-border text-slate-400 select-none">
              <tr>
                <th className="py-2.5 px-3">TIME</th>
                <th className="py-2.5 px-3">SOURCE</th>
                <th className="py-2.5 px-3">DESTINATION</th>
                <th className="py-2.5 px-3">PROTOCOL</th>
                <th className="py-2.5 px-3 text-right">LENGTH</th>
                <th className="py-2.5 px-3">ML PREDICTION</th>
                <th className="py-2.5 px-3 text-right">CONFIDENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/30">
              {packets
                .filter(p => {
                  if (packetFilter === 'threats') return p.prediction !== 'Normal';
                  if (packetFilter === 'normal') return p.prediction === 'Normal';
                  return true;
                })
                .map((packet) => {
                  const isThreat = packet.prediction !== 'Normal';
                  const isBlocked = packet.info.includes('BLOCKED') || packet.info.includes('ISOLATED') || blockedIps.includes(packet.sourceIp) || blockedIps.includes(packet.destinationIp) || isolatedIps.includes(packet.sourceIp) || isolatedIps.includes(packet.destinationIp);
                  
                  let rowClass = 'hover:bg-cyber-card-hover/40 transition-colors cursor-pointer';
                  if (isBlocked) {
                    rowClass = 'text-slate-500 hover:bg-cyber-card-hover/20 cursor-pointer';
                  } else if (isThreat) {
                    rowClass = 'text-accent-rose/90 hover:bg-accent-rose/5 cursor-pointer';
                  }

                  return (
                    <tr 
                      key={packet.id} 
                      onClick={() => setSelectedPacket(packet)}
                      className={rowClass}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500">{packet.timestamp}</td>
                      <td className="py-2.5 px-3 font-semibold">{packet.sourceIp}</td>
                      <td className="py-2.5 px-3">{packet.destinationIp}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${
                          packet.protocol === 'TCP' 
                            ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' 
                            : packet.protocol === 'UDP'
                            ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary'
                            : 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber'
                        }`}>
                          {packet.protocol}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{packet.length} B</td>
                      <td className="py-2.5 px-3">
                        {isBlocked ? (
                          <span className="text-[10px] text-slate-500 italic">BLOCKED</span>
                        ) : (
                          <span className={`font-semibold ${isThreat ? 'text-accent-rose' : 'text-accent-emerald'}`}>
                            {packet.prediction}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {isBlocked ? '-' : `${(packet.confidence * 100).toFixed(2)}%`}
                      </td>
                    </tr>
                  );
                })}
              {packets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No packet logs sniffing interface ... Click 'Resume Sniff' or toggle Attack.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Packet Log Summary */}
      <div className="mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>Sniffing: {interfaces.join(', ')}</span>
        <span>Showing last {packets.length} packets</span>
      </div>
    </div>
  );
}
