import { Activity, Square, Play } from 'lucide-react';

interface TrafficChartProps {
  trafficHistory: number[];
  isUnderAttack: boolean;
  isCapturing: boolean;
  setIsCapturing: (val: boolean) => void;
}

export default function TrafficChart({
  trafficHistory,
  isUnderAttack,
  isCapturing,
  setIsCapturing,
}: TrafficChartProps) {
  // Calculations for custom SVG line chart
  const maxTrafficVal = Math.max(...trafficHistory, 50); // Ensure scaling doesn't break
  const chartWidth = 600;
  const chartHeight = 120;
  const padding = 10;
  const points = trafficHistory.map((val, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (trafficHistory.length - 1);
    const y = chartHeight - padding - (val / maxTrafficVal) * (chartHeight - padding * 2);
    return { x, y };
  });

  // Create SVG path d-string
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // Filled area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-primary animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Live Packet Sniffer Log (Packets/Sec)</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-accent-primary"></span>
            <span>Normal Sniff Rate</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-accent-rose"></span>
            <span>Attack Spikes</span>
          </div>
          <button
            onClick={() => setIsCapturing(!isCapturing)}
            className={`p-1 px-2 border rounded text-[10px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCapturing 
                ? 'border-cyber-border hover:bg-accent-rose/10 hover:border-accent-rose/30 hover:text-accent-rose text-slate-400' 
                : 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20'
            }`}
          >
            {isCapturing ? (
              <>
                <Square className="w-2.5 h-2.5" />
                <span>Pause Sniff</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5" />
                <span>Resume Sniff</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* SVG line chart */}
      <div className="relative bg-cyber-bg/50 border border-cyber-border/40 rounded-lg p-2 h-36 flex items-center justify-center">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Glowing line gradient */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUnderAttack ? '#f43f5e' : '#6366f1'} stopOpacity="0.15" />
              <stop offset="100%" stopColor={isUnderAttack ? '#f43f5e' : '#6366f1'} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#1a2238" strokeDasharray="3 3" />
          <line x1="0" y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="#1a2238" />

          {/* Filled Area */}
          <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-300" />
          
          {/* Line Path */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={isUnderAttack ? '#f43f5e' : '#6366f1'} 
            strokeWidth="1.5" 
            className="transition-all duration-300"
          />

          {/* Active Data Points */}
          {points.map((p, idx) => (
            <circle 
              key={idx} 
              cx={p.x} 
              cy={p.y} 
              r="2" 
              fill={isUnderAttack ? '#f43f5e' : '#6366f1'} 
              className="hover:r-3 cursor-pointer transition-all" 
            />
          ))}
        </svg>

        {/* Floating current packet count */}
        <div className="absolute top-2 right-2 font-mono text-[9px] text-slate-500 bg-cyber-card border border-cyber-border px-1.5 py-0.5 rounded">
          MAX: {maxTrafficVal} pps
        </div>
      </div>
    </div>
  );
}
