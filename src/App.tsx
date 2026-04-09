import { useState, useEffect, useCallback } from 'react';
import { Scan, PlusCircle, History, Trash2, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Scanner from './components/Scanner';
import Generator from './components/Generator';
import { cn } from './lib/utils';

interface ScanHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  type: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'generate' | 'history'>('scan');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('scan-history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = useCallback((text: string, type: string) => {
    const newItem: ScanHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      timestamp: Date.now(),
      type
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 50);
      localStorage.setItem('scan-history', JSON.stringify(updated));
      return updated;
    });
    
    setLastScanned(text);
  }, []);

  const handleScan = useCallback((text: string) => {
    saveToHistory(text, 'QR/Barcode');
  }, [saveToHistory]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('scan-history');
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
            <div className="w-8 h-8 bg-hw-card rounded-lg flex items-center justify-center">
              <Scan className="w-5 h-5 text-white" />
            </div>
            ScanOQRs<span className="text-hw-accent">Pro</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-hw-card/5 rounded border border-hw-card/10">
              <span className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest">v1.0.4</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest opacity-60">Professional Grade Utility</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <Scanner onScan={handleScan} />
              
              {lastScanned && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-hw-card text-white p-5 rounded-3xl shadow-2xl border border-white/5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-hw-secondary uppercase mb-1 tracking-widest">Scanned Result</p>
                      <p className="text-sm font-mono break-all leading-relaxed text-hw-accent">{lastScanned}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {lastScanned.startsWith('http') && (
                      <a
                        href={lastScanned}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 flex items-center justify-center gap-2 bg-hw-accent hover:bg-hw-accent/80 text-white py-3 rounded-xl text-xs font-mono uppercase tracking-widest transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> Open Link
                      </a>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lastScanned);
                        // Optional: show copy success
                      }}
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button
                      onClick={() => setLastScanned(null)}
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all"
                    >
                      <Scan className="w-4 h-4" /> Scan Again
                    </button>
                  </div>
                </motion.div>
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
                      className="bg-white p-4 rounded-2xl border border-hw-card/5 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono bg-hw-card/5 px-1.5 py-0.5 rounded text-hw-secondary uppercase tracking-tighter">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-[9px] font-mono text-hw-secondary/40 uppercase">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-mono break-all line-clamp-2 text-hw-card">{item.text}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(item.text, item.id)}
                            className="p-2 hover:bg-hw-card/5 rounded-lg transition-colors"
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
                              className="p-2 hover:bg-hw-card/5 rounded-lg transition-colors"
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
        <div className="bg-hw-card p-2 rounded-2xl flex items-center justify-between shadow-2xl">
          <button
            onClick={() => setActiveTab('scan')}
            className={cn(
              "flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-300",
              activeTab === 'scan' ? "bg-white/10 text-white" : "text-hw-secondary hover:text-white/60"
            )}
          >
            <Scan className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-mono uppercase tracking-widest">Scan</span>
          </button>
          
          <button
            onClick={() => setActiveTab('generate')}
            className={cn(
              "flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-300",
              activeTab === 'generate' ? "bg-white/10 text-white" : "text-hw-secondary hover:text-white/60"
            )}
          >
            <PlusCircle className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-mono uppercase tracking-widest">Create</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-300",
              activeTab === 'history' ? "bg-white/10 text-white" : "text-hw-secondary hover:text-white/60"
            )}
          >
            <History className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-mono uppercase tracking-widest">History</span>
          </button>
        </div>
      </nav>

      {/* Hardware Accents */}
      <div className="fixed top-0 left-0 w-full h-1 bg-hw-accent opacity-20" />
      <div className="fixed bottom-0 left-0 w-full h-1 bg-hw-accent opacity-20" />
    </div>
  );
}
