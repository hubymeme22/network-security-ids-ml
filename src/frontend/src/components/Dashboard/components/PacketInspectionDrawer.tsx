import { Info, X } from 'lucide-react';
import type { NetworkPacket } from '../../../types';

interface PacketInspectionDrawerProps {
  selectedPacket: NetworkPacket;
  setSelectedPacket: (packet: NetworkPacket | null) => void;
  handleBlockIp: (ip: string) => void;
  handleIsolateNode: (ip: string) => void;
}

export default function PacketInspectionDrawer({
  selectedPacket,
  setSelectedPacket,
  handleBlockIp,
  handleIsolateNode,
}: PacketInspectionDrawerProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-cyber-card border border-cyber-border rounded-xl shadow-2xl overflow-hidden animate-fade-in relative">
        <div className="p-5 border-b border-cyber-border flex items-center justify-between bg-cyber-bg/50">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-accent-cyan" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Packet Security Inspection</h3>
          </div>
          <button
            onClick={() => setSelectedPacket(null)}
            className="p-1 hover:bg-cyber-bg border border-cyber-border text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 text-[11px] font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-2.5 bg-cyber-bg border border-cyber-border rounded">
              <span className="text-slate-500 block text-[9px] uppercase">Packet ID</span>
              <span className="text-white font-semibold">{selectedPacket.id}</span>
            </div>
            <div className="p-2.5 bg-cyber-bg border border-cyber-border rounded">
              <span className="text-slate-500 block text-[9px] uppercase">Timestamp</span>
              <span className="text-white font-semibold">{selectedPacket.timestamp}</span>
            </div>
            <div className="p-2.5 bg-cyber-bg border border-cyber-border rounded">
              <span className="text-slate-500 block text-[9px] uppercase">Source IP</span>
              <span className="text-white font-semibold">{selectedPacket.sourceIp}</span>
            </div>
            <div className="p-2.5 bg-cyber-bg border border-cyber-border rounded">
              <span className="text-slate-500 block text-[9px] uppercase">Destination IP</span>
              <span className="text-white font-semibold">{selectedPacket.destinationIp}</span>
            </div>
            <div className="p-2.5 bg-cyber-bg border border-cyber-border rounded">
              <span className="text-slate-500 block text-[9px] uppercase">Protocol</span>
              <span className="text-white font-semibold">{selectedPacket.protocol}</span>
            </div>
            <div className="p-2.5 bg-cyber-bg border border-cyber-border rounded">
              <span className="text-slate-500 block text-[9px] uppercase">Size</span>
              <span className="text-white font-semibold">{selectedPacket.length} Bytes</span>
            </div>
          </div>

          <div className="p-3 bg-cyber-bg border border-cyber-border rounded">
            <span className="text-slate-500 block text-[9px] uppercase mb-1">Payload Analysis & Details</span>
            <span className="text-slate-300 text-xs leading-relaxed">{selectedPacket.info}</span>
          </div>

          <div className="p-4 border rounded flex items-center justify-between bg-cyber-bg/50 border-cyber-border">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase mb-1 font-semibold">ML Prediction Classification</span>
              <span className={`text-sm font-bold uppercase tracking-wider ${
                selectedPacket.prediction !== 'Normal' ? 'text-accent-rose' : 'text-accent-emerald'
              }`}>
                {selectedPacket.prediction}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[9px] uppercase mb-1">Inference Confidence</span>
              <span className="text-sm font-extrabold text-white">
                {(selectedPacket.confidence * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {selectedPacket.prediction !== 'Normal' && (
            <div className="flex items-center gap-2 border-t border-cyber-border/40 pt-4">
              <button
                onClick={() => {
                  handleBlockIp(selectedPacket.sourceIp);
                  setSelectedPacket(null);
                }}
                className="flex-1 py-2 bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose border border-accent-rose/30 hover:border-accent-rose/50 rounded font-semibold text-center uppercase transition-all cursor-pointer"
              >
                Block Source IP ({selectedPacket.sourceIp})
              </button>
              <button
                onClick={() => {
                  handleIsolateNode(selectedPacket.sourceIp);
                  setSelectedPacket(null);
                }}
                className="flex-1 py-2 bg-accent-amber/10 hover:bg-accent-amber/20 text-accent-amber border border-accent-amber/30 hover:border-accent-amber/50 rounded font-semibold text-center uppercase transition-all cursor-pointer"
              >
                Isolate Source
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
