import { useState, useEffect, useRef } from 'react';
import type { NetworkPacket, SecurityAlert, SystemMetrics, AlertSeverity } from '../../types';

// Import sub-components
import DashboardHeader from './components/DashboardHeader';
import SettingsPanel from './components/SettingsPanel';
import MetricsStrip from './components/MetricsStrip';
import TrafficChart from './components/TrafficChart';
import PacketStreamTable from './components/PacketStreamTable';
import SecurityAlertsPanel from './components/SecurityAlertsPanel';
import InterfacePanel from './components/InterfacePanel';
import PacketInspectionDrawer from './components/PacketInspectionDrawer';
import Toast from '../../core_components/Toast';

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
      try {
        const rawData = event.data;
        if (rawData.startsWith('{')) {
          const parsed = JSON.parse(rawData);
          handleIncomingLivePacket(parsed);
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
    
    const interval = setInterval(() => {
      const protocol = mockProtocols[Math.floor(Math.random() * mockProtocols.length)];
      let srcIp = mockIps[Math.floor(Math.random() * mockIps.length)];
      let destIp = mockIps[Math.floor(Math.random() * mockIps.length)];
      while (srcIp === destIp) {
        destIp = mockIps[Math.floor(Math.random() * mockIps.length)];
      }

      let isThreat = false;
      let prediction: NetworkPacket['prediction'] = 'Normal';
      let confidence = parseFloat((0.85 + Math.random() * 0.14).toFixed(4));
      
      const threatRoll = Math.random() * 100;
      const attackChance = isUnderAttack ? 60 : (100 - sensitivity);

      if (threatRoll < attackChance) {
        isThreat = true;
        srcIp = isUnderAttack ? '185.220.101.5' : srcIp;
        const threats: NetworkPacket['prediction'][] = ['DoS', 'Portscan', 'BruteForce', 'Probe'];
        prediction = threats[Math.floor(Math.random() * threats.length)];
      }

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

      processPacket(newPacket);

      if (isLiveMode && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(newPacket));
      }

    }, isUnderAttack ? 300 : 800);

    return () => clearInterval(interval);
  }, [isCapturing, isLiveMode, isUnderAttack, sensitivity]);

  const processPacket = (packet: NetworkPacket) => {
    const isIpBlocked = blockedIps.includes(packet.sourceIp) || blockedIps.includes(packet.destinationIp);
    const isIpIsolated = isolatedIps.includes(packet.sourceIp) || isolatedIps.includes(packet.destinationIp);

    if (isIpBlocked) {
      packet.info = `[BLOCKED IP] packet dropped by firewall rules`;
      packet.prediction = 'Normal';
    } else if (isIpIsolated) {
      packet.info = `[ISOLATED NODE] dropped transmission`;
      packet.prediction = 'Normal';
    }

    setPackets(prev => {
      const next = [packet, ...prev];
      return next.slice(0, 50);
    });

    if (packet.prediction !== 'Normal' && !isIpBlocked && !isIpIsolated) {
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
        const exists = prev.some(a => a.sourceIp === packet.sourceIp && a.message.includes(packet.prediction) && a.status === 'Active');
        if (exists) return prev;
        return [newAlert, ...prev].slice(0, 30);
      });

      setMetrics(prev => ({
        ...prev,
        activeThreats: prev.activeThreats + 1
      }));

      if (severity === 'Critical' || severity === 'High') {
        triggerToast(`THREAT INTRUSION: ${newAlert.message}`, 'error');
      }
    }
  };

  useEffect(() => {
    const metricsInterval = setInterval(() => {
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

        const baseIn = isUnderAttack ? 18.5 : 2.4;
        const baseOut = isUnderAttack ? 9.2 : 1.1;
        const bwIn = Math.max(0.1, baseIn + (Math.random() - 0.5) * 1.5);
        const bwOut = Math.max(0.1, baseOut + (Math.random() - 0.5) * 0.8);

        const activeThreatsCount = alerts.filter(a => a.status === 'Active' && !blockedIps.includes(a.sourceIp) && !isolatedIps.includes(a.sourceIp)).length;

        return {
          ...prev,
          cpuUsage: Math.round(targetCpu),
          memoryUsage: Math.round(targetMem),
          bandwidthIn: parseFloat(bwIn.toFixed(2)),
          bandwidthOut: parseFloat(bwOut.toFixed(2)),
          activeThreats: activeThreatsCount
        };
      });

      setTrafficHistory(prev => {
        let currentPps = isUnderAttack ? Math.floor(Math.random() * 80 + 120) : Math.floor(Math.random() * 30 + 15);
        if (!isCapturing) currentPps = 0;
        const next = [...prev.slice(1), currentPps];
        return next;
      });

    }, 1500);

    return () => clearInterval(metricsInterval);
  }, [isUnderAttack, alerts, isCapturing, blockedIps, isolatedIps]);

  const handleBlockIp = (ip: string) => {
    if (!blockedIps.includes(ip)) {
      setBlockedIps(prev => [...prev, ip]);
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

  const handleClearBlockedIps = () => {
    setBlockedIps([]);
    triggerToast('All blocked IPs flushed.');
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-100 flex flex-col font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage.text} type={toastMessage.type} />
      )}

      {/* Top Banner / System Status Bar */}
      <DashboardHeader
        username={username}
        selectedInterface={selectedInterface}
        isUnderAttack={isUnderAttack}
        setIsUnderAttack={setIsUnderAttack}
        isLiveMode={isLiveMode}
        setIsLiveMode={setIsLiveMode}
        webSocketStatus={webSocketStatus}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        onLogout={onLogout}
        triggerToast={triggerToast}
      />

      {/* Main Grid Content */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Settings Panel Drawer */}
        {showSettings && (
          <SettingsPanel
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
            blockedIpsCount={blockedIps.length}
            onClearBlockedIps={handleClearBlockedIps}
          />
        )}

        {/* 1. Metrics Strip (Span 4 columns) */}
        <MetricsStrip
          isUnderAttack={isUnderAttack}
          metrics={metrics}
          blockedIpsCount={blockedIps.length}
        />

        {/* 2. Custom SVG Charts Section (Span 3 columns in large layouts) */}
        <section className="col-span-1 xl:col-span-3 space-y-6">
          <TrafficChart
            trafficHistory={trafficHistory}
            isUnderAttack={isUnderAttack}
            isCapturing={isCapturing}
            setIsCapturing={setIsCapturing}
          />

          {/* 3. Live Traffic Packet Stream Table */}
          <PacketStreamTable
            packets={packets}
            packetFilter={packetFilter}
            setPacketFilter={setPacketFilter}
            setSelectedPacket={setSelectedPacket}
            interfaces={interfaces}
            blockedIps={blockedIps}
            isolatedIps={isolatedIps}
          />
        </section>

        {/* 3. Sidebar Alerts Panel (Span 1 column) */}
        <section className="col-span-1 space-y-6">
          <SecurityAlertsPanel
            alerts={alerts}
            blockedIps={blockedIps}
            isolatedIps={isolatedIps}
            handleClearAlerts={handleClearAlerts}
            handleBlockIp={handleBlockIp}
            handleIsolateNode={handleIsolateNode}
            handleIgnoreAlert={handleIgnoreAlert}
          />
        </section>

        {/* 4. Custom SVG Bar Chart (Span 3 columns) */}
        <section className="col-span-1 xl:col-span-3">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Anomaly Distribution (Inference Counts)</h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Categorized packets since dashboard load
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="bg-cyber-bg/30 border border-cyber-border/40 rounded-lg p-5 h-36 flex items-center justify-between gap-4">
              {['DoS', 'Portscan', 'BruteForce', 'Probe'].map((cat) => {
                const count = packets.reduce((acc, p) => {
                  if (p.prediction === cat) {
                    const isBlocked = blockedIps.includes(p.sourceIp) || blockedIps.includes(p.destinationIp) || isolatedIps.includes(p.sourceIp) || isolatedIps.includes(p.destinationIp);
                    if (!isBlocked) return acc + 1;
                  }
                  return acc;
                }, 0);

                const maxCategoryCount = Math.max(...['DoS', 'Portscan', 'BruteForce', 'Probe'].map(c => 
                  packets.reduce((acc, p) => {
                    if (p.prediction === c) {
                      const isBlocked = blockedIps.includes(p.sourceIp) || blockedIps.includes(p.destinationIp) || isolatedIps.includes(p.sourceIp) || isolatedIps.includes(p.destinationIp);
                      if (!isBlocked) return acc + 1;
                    }
                    return acc;
                  }, 0)
                ), 5);

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
          <InterfacePanel
            selectedInterface={selectedInterface}
            setSelectedInterface={setSelectedInterface}
            interfaces={interfaces}
            blockedIps={blockedIps}
            isolatedIps={isolatedIps}
            setBlockedIps={setBlockedIps}
            setIsolatedIps={setIsolatedIps}
            triggerToast={triggerToast}
          />
        </section>

      </main>

      {/* Packet Inspection Drawer (Overlay Dialog) */}
      {selectedPacket && (
        <PacketInspectionDrawer
          selectedPacket={selectedPacket}
          setSelectedPacket={setSelectedPacket}
          handleBlockIp={handleBlockIp}
          handleIsolateNode={handleIsolateNode}
        />
      )}

      {/* Footer bar */}
      <footer className="border-t border-cyber-border bg-cyber-card/45 py-3 px-6 text-center mt-auto font-mono text-[9px] text-slate-500">
        <span>SentinelCore // Security Console Console Deployment 2026 // Active Mode</span>
      </footer>

    </div>
  );
}
