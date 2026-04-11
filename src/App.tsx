import { useState, useEffect, useCallback } from 'react';
import { Scan, PlusCircle, History, Trash2, Copy, ExternalLink, CheckCircle2, Barcode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Scanner from './components/Scanner';
import Generator from './components/Generator';
import { cn } from './lib/utils';
import { sanitizeUrl } from './lib/security';

interface ScanHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  type: 'QR' | 'Barcode';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'barcode' | 'generate' | 'history'>('scan');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [lastScanned, setLastScanned] = useState<{ text: string; type: 'QR' | 'Barcode' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('scan-history-v2');
    if (saved) setHistory(JSON.parse(saved));
    else {
      // Migrate old history if exists
      const old = localStorage.getItem('scan-history');
      if (old) {
        const parsed = JSON.parse(old).map((item: any) => ({ ...item, type: 'QR' }));
        setHistory(parsed);
        localStorage.setItem('scan-history-v2', JSON.stringify(parsed));
      }
    }
  }, []);

  const saveToHistory = useCallback((text: string, type: 'QR' | 'Barcode') => {
    const sanitized = sanitizeUrl(text);
    if (!sanitized) return;

    const newItem: ScanHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: sanitized,
      timestamp: Date.now(),
      type
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 50);
      localStorage.setItem('scan-history-v2', JSON.stringify(updated));
      return updated;
    });
    
    setLastScanned({ text: sanitized, type });
  }, []);

  const handleScanQR = useCallback((text: string) => {
    saveToHistory(text, 'QR');
  }, [saveToHistory]);

  const handleScanBarcode = useCallback((text: string) => {
    saveToHistory(text, 'Barcode');
  }, [saveToHistory]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('scan-history-v2');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-hw-bg shadow-2xl border-x border-hw-card/5">
      {/* Header */}
      <header className="p-6 pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-mono font-bold tracking-tighter uppercase flex items-center gap-2">
            <div className="w-8 h-8 bg-hw-card rounded-lg flex items-center justify-center shadow-lg shadow-hw-accent/20">
              {activeTab === 'barcode' ? (
                <Barcode className="w-5 h-5 text-white" />
              ) : (
                <Scan className="w-5 h-5 text-white" />
              )}
            </div>
            ScanOQRs<span className="text-hw-accent">Pro</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-hw-card/5 rounded border border-hw-card/10">
              <span className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest">v1.1.0</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest opacity-60">Verified Security & Multi-Scan</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {/* QR Scan Tab */}
          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Scanner mode="qr" onScan={handleScanQR} />
              
              {lastScanned && lastScanned.type === 'QR' && (
                <ResultCard data={lastScanned.text} onClear={() => setLastScanned(null)} />
              )}
            </motion.div>
          )}

          {/* Barcode Scan Tab */}
          {activeTab === 'barcode' && (
            <motion.div
              key="barcode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Scanner mode="barcode" onScan={handleScanBarcode} />
              
              {lastScanned && lastScanned.type === 'Barcode' && (
                <ResultCard data={lastScanned.text} onClear={() => setLastScanned(null)} />
              )}
            </motion.div>
          )}

          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Generator />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-hw-secondary">Recent Activity</h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] font-mono text-hw-accent uppercase hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-40">
                  <History className="w-12 h-12 mx-auto text-hw-secondary" />
                  <p className="text-xs font-mono uppercase tracking-widest">No history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      className="bg-hw-card p-4 rounded-2xl border border-white/5 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-hw-secondary uppercase tracking-tighter">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-[9px] font-mono text-hw-secondary/40 uppercase">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-sm font-mono break-all line-clamp-2 text-white">{item.text}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(item.text, item.id)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            {copiedId === item.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-hw-secondary" />
                            )}
                          </button>
                          {item.text.startsWith('http') && (
                            <a
                              href={item.text}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-hw-secondary" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="p-6 pt-2">
        <div className="bg-hw-card p-2 rounded-2xl flex items-center justify-between shadow-2xl border border-white/5">
          <NavButton 
            active={activeTab === 'scan'} 
            onClick={() => setActiveTab('scan')} 
            icon={<Scan className="w-4 h-4" />} 
            label="QR" 
          />
          <NavButton 
            active={activeTab === 'barcode'} 
            onClick={() => setActiveTab('barcode')} 
            icon={<Barcode className="w-4 h-4" />} 
            label="Barcode" 
          />
          <NavButton 
            active={activeTab === 'generate'} 
            onClick={() => setActiveTab('generate')} 
            icon={<PlusCircle className="w-4 h-4" />} 
            label="Create" 
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History className="w-4 h-4" />} 
            label="Logs" 
          />
        </div>
      </nav>

      <div className="fixed top-0 left-0 w-full h-1 bg-hw-accent opacity-20 pointer-events-none" />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all duration-300",
        active ? "bg-white/10 text-white shadow-inner" : "text-hw-secondary hover:text-white/60"
      )}
    >
      <div className={cn("mb-1 transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
      <span className="text-[8px] font-mono uppercase tracking-[0.15em] font-bold">{label}</span>
    </button>
  );
}

function ResultCard({ data, onClear }: { data: string; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-hw-card text-white p-5 rounded-3xl shadow-2xl border border-white/10 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-hw-secondary uppercase mb-1 tracking-widest">Scanned Result</p>
          <p className="text-sm font-mono break-all leading-relaxed text-hw-accent">{data}</p>
        </div>
        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center shrink-0 border border-green-500/20">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.startsWith('http') && (
          <a
            href={data}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex items-center justify-center gap-2 bg-hw-accent hover:bg-hw-accent/80 text-white py-3 rounded-xl text-xs font-mono uppercase tracking-widest transition-all shadow-lg shadow-hw-accent/20"
          >
            <ExternalLink className="w-4 h-4" /> Open Link
          </a>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(data)}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all border border-white/5"
        >
          <Copy className="w-4 h-4" /> Copy
        </button>
        <button
          onClick={onClear}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all border border-white/5"
        >
          <Scan className="w-4 h-4" /> Dismiss
        </button>
      </div>
    </motion.div>
  );
}
