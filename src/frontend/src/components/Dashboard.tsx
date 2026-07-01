import { useState, useEffect, useRef } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, Activity, Server, Cpu, Database, 
  AlertTriangle, Play, Square, Wifi, X, AlertOctagon, CheckCircle, 
  Trash2, Settings, Info, LogOut, Radio, AlertCircle
} from 'lucide-react';
import type { NetworkPacket, SecurityAlert, SystemMetrics, AlertSeverity } from '../types';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

// Generate realistic mock IP addresses
const mockIps = [
  '192.168.1.45', '10.0.0.12', '172.16.5.109', '192.168.1.1', '10.0.0.1',
  '198.51.100.12', '203.0.113.88', '185.220.101.5', '45.227.254.12', '8.8.8.8'
];

const mockServices = ['http', 'smtp', 'ftp', 'ssh', 'dns', 'private', 'domain', 'telnet'];
const mockProtocols: ('TCP' | 'UDP' | 'ICMP')[] = ['TCP', 'UDP', 'ICMP'];

export default function Dashboard({ username, onLogout }: DashboardProps) {
  // Config & State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(true);
  const [isUnderAttack, setIsUnderAttack] = useState(false);
  const [sensitivity, setSensitivity] = useState(70); // Threshold for ML trigger
  
  // Data State
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 12,
    memoryUsage: 34,
    bandwidthIn: 1.2,
    bandwidthOut: 0.8,
    activeThreats: 0,
    firewallStatus: 'Active'
  });
  
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [isolatedIps, setIsolatedIps] = useState<string[]>([]);
  
  // UI States
  const [packetFilter, setPacketFilter] = useState<'all' | 'threats' | 'normal'>('all');
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [webSocketStatus, setWebSocketStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

  // SVG Chart History Data
  const [trafficHistory, setTrafficHistory] = useState<number[]>(Array(20).fill(10));
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const packetIdCounter = useRef(0);

  // Show status toasts
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Network Interfaces (FastAPI backend endpoint '/devices/network-cards')
  useEffect(() => {
    const fetchInterfaces = async () => {
      try {
        const res = await fetch('/devices/network-cards');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setInterfaces(data);
            setSelectedInterface(data[0]);
            return;
          }
        }
        throw new Error('Backend failed or empty');
      } catch (err) {
        // Fallback to mock interfaces
        const mockInts = ['eth0', 'wlan0', 'lo', 'docker0'];
        setInterfaces(mockInts);
        setSelectedInterface(mockInts[0]);
      }
    };
    fetchInterfaces();
  }, []);

  // 2. Establish WebSocket connection if in Live Mode
  useEffect(() => {
    if (!isLiveMode) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWebSocketStatus('disconnected');
      return;
    }

    setWebSocketStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Will use Vite proxy server
    const session = `sentinel_${Math.random().toString(36).substring(7)}`;
    
    // Connect to WebSocket route
    const ws = new WebSocket(`${protocol}//${host}/live-inference/${session}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWebSocketStatus('connected');
      triggerToast('Live system packet capture pipeline active.', 'success');
    };

    ws.onmessage = (event) => {
      // In a real system, the backend sends packet inference logs.
      // Since backend's default socket is a simple echo, we parse or feed it.
      // If the backend sent real JSON, we would parse it here:
      try {
        const rawData = event.data;
        if (rawData.startsWith('{')) {
          const parsed = JSON.parse(rawData);
          handleIncomingLivePacket(parsed);
        } else {
          // If it's the echo message, we can ignore or log it
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onerror = () => {
      setWebSocketStatus('disconnected');
    };

    ws.onclose = () => {
      setWebSocketStatus('disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isLiveMode]);

  // Method to handle actual backend packet if WebSocket was active
  const handleIncomingLivePacket = (packet: any) => {
    // Structure backend packet to NetworkPacket type
    const newPacket: NetworkPacket = {
      id: packet.id || String(packetIdCounter.current++),
      timestamp: new Date().toLocaleTimeString(),
      sourceIp: packet.sourceIp || '192.168.1.100',
      destinationIp: packet.destinationIp || '192.168.1.1',
      protocol: packet.protocol || 'TCP',
      length: packet.length || 64,
      info: packet.info || 'Inference frame',
      prediction: packet.prediction || 'Normal',
      confidence: packet.confidence || 0.99
    };
    processPacket(newPacket);
  };

  // 3. Simulated packet/alerts generator (Mock Mode fallback)
  useEffect(() => {
    if (!isCapturing) return;
    
    // In live mode, we rely on the websocket or REST polling. 
    // However, since backend doesn't actively sniff packets out of the box in main.py,
    // we run a background generator that simulates live sniffed packets, but feeds
    // them to the websocket (echoing them) to simulate live duplex streaming.
    
    const interval = setInterval(() => {
      // Generate packet
      const protocol = mockProtocols[Math.floor(Math.random() * mockProtocols.length)];
      let srcIp = mockIps[Math.floor(Math.random() * mockIps.length)];
      let destIp = mockIps[Math.floor(Math.random() * mockIps.length)];
      while (srcIp === destIp) {
        destIp = mockIps[Math.floor(Math.random() * mockIps.length)];
      }

      // If under attack, simulate malicious sources and targets
      let isThreat = false;
      let prediction: NetworkPacket['prediction'] = 'Normal';
      let confidence = parseFloat((0.85 + Math.random() * 0.14).toFixed(4));
      
      const threatRoll = Math.random() * 100;
      const attackChance = isUnderAttack ? 60 : (100 - sensitivity);

      if (threatRoll < attackChance) {
        isThreat = true;
        // Cyber attack IP
        srcIp = isUnderAttack ? '185.220.101.5' : srcIp;
        const threats: NetworkPacket['prediction'][] = ['DoS', 'Portscan', 'BruteForce', 'Probe'];
        prediction = threats[Math.floor(Math.random() * threats.length)];
      }

      // Length and service info
      const length = isThreat ? Math.floor(Math.random() * 1200 + 40) : Math.floor(Math.random() * 300 + 40);
      const service = mockServices[Math.floor(Math.random() * mockServices.length)];
      const info = isThreat 
        ? `Anomaly: suspicious payload detected on service ${service.toUpperCase()}`
        : `Connection established on ${service.toUpperCase()}`;

      const newPacket: NetworkPacket = {
        id: `PKT-${String(packetIdCounter.current++).padStart(5, '0')}`,
        timestamp: new Date().toLocaleTimeString(),
        sourceIp: srcIp,
        destinationIp: destIp,
        protocol,
        length,
        info,
        prediction,
        confidence
      };

      // Process it locally
      processPacket(newPacket);

      // If live websocket is connected, we can send a message to simulate sending/receiving sniff metadata
      if (isLiveMode && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(newPacket));
      }

    }, isUnderAttack ? 300 : 800);

    return () => clearInterval(interval);
  }, [isCapturing, isLiveMode, isUnderAttack, sensitivity]);

  // Main packet processing logic
  const processPacket = (packet: NetworkPacket) => {
    // If packet IP is blocked or isolated, drop it or mark it
    const isIpBlocked = blockedIps.includes(packet.sourceIp) || blockedIps.includes(packet.destinationIp);
    const isIpIsolated = isolatedIps.includes(packet.sourceIp) || isolatedIps.includes(packet.destinationIp);

    if (isIpBlocked) {
      packet.info = `[BLOCKED IP] packet dropped by firewall rules`;
      packet.prediction = 'Normal'; // No threat state processed on blocked packets
    } else if (isIpIsolated) {
      packet.info = `[ISOLATED NODE] dropped transmission`;
      packet.prediction = 'Normal';
    }

    // Append to packets queue
    setPackets(prev => {
      const next = [packet, ...prev];
      return next.slice(0, 50); // Keep last 50 packets
    });

    // Handle Alerts
    if (packet.prediction !== 'Normal' && !isIpBlocked && !isIpIsolated) {
      // Trigger new Security Alert
      const alertId = `ALT-${Math.random().toString(36).substring(4, 9).toUpperCase()}`;
      let severity: AlertSeverity = 'Medium';
      if (packet.prediction === 'DoS') severity = 'Critical';
      else if (packet.prediction === 'BruteForce') severity = 'High';
      else if (packet.prediction === 'Portscan') severity = 'Medium';
      else severity = 'Low';

      const newAlert: SecurityAlert = {
        id: alertId,
        timestamp: new Date().toLocaleTimeString(),
        message: `${packet.prediction} attempt identified from ${packet.sourceIp}`,
        sourceIp: packet.sourceIp,
        severity,
        status: 'Active'
      };

      setAlerts(prev => {
        // Prevent duplicate active alerts for the same IP and type within short window
        const exists = prev.some(a => a.sourceIp === packet.sourceIp && a.message.includes(packet.prediction) && a.status === 'Active');
        if (exists) return prev;
        return [newAlert, ...prev].slice(0, 30);
      });

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activeThreats: prev.activeThreats + 1
      }));

      // Toast notification for Critical and High alerts
      if (severity === 'Critical' || severity === 'High') {
        triggerToast(`THREAT INTRUSION: ${newAlert.message}`, 'error');
      }
    }
  };

  // 4. Update system metrics and traffic chart history at a regular interval
  useEffect(() => {
    const metricsInterval = setInterval(() => {
      // Smooth random walk for CPU and memory usage
      setMetrics(prev => {
        const cpuDelta = (Math.random() - 0.5) * 4;
        const memDelta = (Math.random() - 0.5) * 1.5;
        
        let targetCpu = prev.cpuUsage + cpuDelta;
        let targetMem = prev.memoryUsage + memDelta;

        if (isUnderAttack) {
          targetCpu = Math.min(95, targetCpu + 10);
        } else {
          targetCpu = Math.max(8, Math.min(60, targetCpu));
        }
        
        targetMem = Math.max(30, Math.min(80, targetMem));

        // Bandwidth
        const baseIn = isUnderAttack ? 18.5 : 2.4;
        const baseOut = isUnderAttack ? 9.2 : 1.1;
        const bwIn = Math.max(0.1, baseIn + (Math.random() - 0.5) * 1.5);
        const bwOut = Math.max(0.1, baseOut + (Math.random() - 0.5) * 0.8);

        // Active threat count from currently active alerts
        const activeThreatsCount = alerts.filter(a => a.status === 'Active').length;

        return {
          ...prev,
          cpuUsage: Math.round(targetCpu),
          memoryUsage: Math.round(targetMem),
          bandwidthIn: parseFloat(bwIn.toFixed(2)),
          bandwidthOut: parseFloat(bwOut.toFixed(2)),
          activeThreats: activeThreatsCount
        };
      });

      // Add to traffic history chart
      setTrafficHistory(prev => {
        // Calculate dynamic value based on current state
        let currentPps = isUnderAttack ? Math.floor(Math.random() * 80 + 120) : Math.floor(Math.random() * 30 + 15);
        if (!isCapturing) currentPps = 0;
        const next = [...prev.slice(1), currentPps];
        return next;
      });

    }, 1500);

    return () => clearInterval(metricsInterval);
  }, [isUnderAttack, alerts, isCapturing]);

  // Mitigation Handlers
  const handleBlockIp = (ip: string) => {
    if (!blockedIps.includes(ip)) {
      setBlockedIps(prev => [...prev, ip]);
      
      // Update all alerts from this IP to mitigated
      setAlerts(prev => prev.map(a => a.sourceIp === ip ? { ...a, status: 'Mitigated' } : a));
      
      triggerToast(`IP ${ip} blocked in firewall configurations.`, 'success');
    }
  };

  const handleIsolateNode = (ip: string) => {
    if (!isolatedIps.includes(ip)) {
      setIsolatedIps(prev => [...prev, ip]);
      setAlerts(prev => prev.map(a => a.sourceIp === ip ? { ...a, status: 'Mitigated' } : a));
      triggerToast(`Node ${ip} isolated from network segments.`, 'success');
    }
  };

  const handleIgnoreAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Ignored' } : a));
    triggerToast('Alert ignored.', 'info');
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    triggerToast('Alert logs cleared.', 'info');
  };

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

  // Calculations for custom SVG bar chart of alert predictions
  const predictionCounts = packets.reduce((acc, p) => {
    if (p.prediction !== 'Normal') {
      acc[p.prediction] = (acc[p.prediction] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const threatCategories = ['DoS', 'Portscan', 'BruteForce', 'Probe'];
  const maxCategoryCount = Math.max(...threatCategories.map(c => predictionCounts[c] || 0), 5);

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-100 flex flex-col font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl border flex items-center gap-3 animate-pulse-slow max-w-sm transition-all duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald' 
            : toastMessage.type === 'error'
            ? 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose'
            : 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / System Status Bar */}
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

      {/* Main Grid Content */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Settings Panel Drawer (Appears above core layout) */}
        {showSettings && (
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
                  <span className="text-white font-semibold font-mono">{blockedIps.length} rules active</span>
                </div>
                {blockedIps.length > 0 && (
                  <button
                    onClick={() => {
                      setBlockedIps([]);
                      triggerToast('All blocked IPs flushed.');
                    }}
                    className="p-1 px-2 border border-cyber-border rounded text-[10px] text-accent-rose hover:bg-accent-rose/10 transition-colors"
                  >
                    Clear Rules
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. Metrics Strip (Span 4 columns) */}
        <section className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
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
              BLOCKED IPs: {blockedIps.length} active rules
            </div>
          </div>

        </section>

        {/* 2. Custom SVG Charts Section (Span 3 columns in large layouts) */}
        <section className="col-span-1 xl:col-span-3 space-y-6">
          
          {/* Custom SVG Live Traffic chart */}
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

          {/* 3. Live Traffic Packet Stream Table */}
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
                        const isBlocked = packet.info.includes('BLOCKED') || packet.info.includes('ISOLATED');
                        
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

        </section>

        {/* 3. Sidebar Alerts Panel (Span 1 column) */}
        <section className="col-span-1 space-y-6">
          
          {/* Active Security alerts list */}
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
                  const isMitigated = alert.status === 'Mitigated';
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

        </section>

        {/* 4. Custom SVG Bar Chart (Span 3 columns) */}
        <section className="col-span-1 xl:col-span-3">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-cyan" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Anomaly Distribution (Inference Counts)</h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Categorized packets since dashboard load
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="bg-cyber-bg/30 border border-cyber-border/40 rounded-lg p-5 h-36 flex items-center justify-between gap-4">
              {threatCategories.map((cat) => {
                const count = predictionCounts[cat] || 0;
                const percent = maxCategoryCount > 0 ? (count / maxCategoryCount) * 100 : 0;
                
                let barColor = 'bg-accent-primary';
                if (cat === 'DoS') barColor = 'bg-accent-rose';
                else if (cat === 'BruteForce') barColor = 'bg-accent-amber';
                else if (cat === 'Portscan') barColor = 'bg-accent-cyan';

                return (
                  <div key={cat} className="flex-1 flex flex-col items-center justify-end h-full">
                    {/* Count label */}
                    <span className="text-[10px] font-mono font-bold text-white mb-2">{count}</span>
                    
                    {/* SVG/CSS Bar */}
                    <div className="w-full bg-cyber-bg border border-cyber-border rounded-t-md h-20 overflow-hidden flex items-end">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-700 ease-out ${barColor}`}
                        style={{ height: `${percent}%` }}
                      ></div>
                    </div>

                    {/* Category Label */}
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-2 font-semibold">
                      {cat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Interface details / blocked list (Span 1 column) */}
        <section className="col-span-1">
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
        </section>

      </main>

      {/* Packet Inspection Drawer (Overlay Dialog) */}
      {selectedPacket && (
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
      )}

      {/* Footer bar */}
      <footer className="border-t border-cyber-border bg-cyber-card/45 py-3 px-6 text-center mt-auto font-mono text-[9px] text-slate-500">
        <span>SentinelCore // Security Console Console Deployment 2026 // Active Mode</span>
      </footer>

    </div>
  );
}
