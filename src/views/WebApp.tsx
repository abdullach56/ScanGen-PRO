import { useState, useEffect, useCallback } from 'react';
import { Scan, PlusCircle, History, Trash2, Copy, ExternalLink, CheckCircle2, Download, ChevronLeft, MessageSquare, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Scanner from '../components/Scanner';
import Generator from '../components/Generator';
import { cn } from '../lib/utils';
import { sanitizeUrl, isLink } from '../lib/security';

interface ScanHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  type: 'QR';
}

interface WebAppProps {
  isNative: boolean;
  onBack?: () => void;
}

export default function WebApp({ isNative, onBack }: WebAppProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'generate' | 'history'>('scan');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [lastScanned, setLastScanned] = useState<{ text: string; type: 'QR' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('scan-history-v2');
      if (saved) {
        setHistory(JSON.parse(saved));
      } else {
        const old = localStorage.getItem('scan-history');
        if (old) {
          const parsed = JSON.parse(old).map((item: any) => ({ ...item, type: 'QR' }));
          setHistory(parsed);
          localStorage.setItem('scan-history-v2', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      setHistory([]);
    }
  }, []);

  const saveToHistory = useCallback((text: string) => {
    const sanitized = sanitizeUrl(text);
    if (!sanitized) return;

    const newItem: ScanHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: sanitized,
      timestamp: Date.now(),
      type: 'QR'
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 50);
      localStorage.setItem('scan-history-v2', JSON.stringify(updated));
      return updated;
    });
    
    setLastScanned({ text: sanitized, type: 'QR' });
  }, []);

  const handleScanQR = useCallback((text: string) => {
    saveToHistory(text);
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

  const handleTabChange = (tab: 'scan' | 'generate' | 'history') => {
    // On web browser, gate the generate tab behind the download prompt
    if (tab === 'generate' && !isNative) {
      setShowPrompt(true);
      return;
    }
    setActiveTab(tab);
  };

  const sendFeedback = () => {
    if (!feedbackText.trim()) return;
    const subject = encodeURIComponent('ScanGen-PRO Feedback');
    const body = encodeURIComponent(feedbackText);
    window.location.href = `mailto:charoliyaabdulla3@gmail.com?subject=${subject}&body=${body}`;
    setShowFeedback(false);
    setFeedbackText('');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-hw-bg shadow-[0_0_100px_rgba(0,0,0,0.8)] border-x border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-[20%] -right-[20%] w-[60%] h-[40%] bg-hw-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[10%] -left-[20%] w-[50%] h-[30%] bg-hw-accent/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="p-8 pb-4 space-y-1 relative z-10">
        <div className="flex items-center justify-between">
          {/* Show Exit Demo ONLY on web browser, never in APK */}
          {!isNative && onBack ? (
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl hover:bg-white/5 transition-all text-hw-secondary hover:text-white group"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Exit Demo</span>
            </button>
          ) : (
            <div /> /* Empty spacer for APK so justify-between still works */
          )}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFeedback(true)}
              className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-hw-accent glow-accent"
              title="Give Feedback"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              <span className="text-[9px] font-mono text-hw-secondary uppercase tracking-[0.2em] font-bold">V1.3.0</span>
            </div>
          </div>
        </div>
        <div className="pt-4 flex items-center gap-3">
          <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center glow-accent">
            <Scan className="w-6 h-6 text-hw-accent" />
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-tighter uppercase">
            <span className="tracking-tight">ScanGen</span><span className="text-hw-accent">PRO</span>
          </h1>
        </div>
        {/* Show "Limited" subtitle only on web, not inside APK */}
        {!isNative && (
          <p className="text-[10px] font-mono text-hw-secondary/60 uppercase tracking-[0.3em] pl-1">Live Web Preview (Limited)</p>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Scanner onScan={handleScanQR} />
              
              {lastScanned && (
                <ResultCard data={lastScanned.text} onClear={() => setLastScanned(null)} />
              )}
            </motion.div>
          )}

          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
                            className="p-2.5 glass-button rounded-xl"
                          >
                            {copiedId === item.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-hw-secondary" />
                            )}
                          </button>
                          {isLink(item.text) && (
                            <a
                              href={item.text}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 glass-button rounded-xl group-hover:bg-hw-accent/20 transition-all"
                            >
                              <ExternalLink className="w-4 h-4 text-hw-accent" />
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

      {/* Download Prompt Modal — ONLY shown on web browser, never in APK */}
      <AnimatePresence>
        {showPrompt && !isNative && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-8 rounded-[2.5rem] max-w-xs w-full space-y-6 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-hw-accent/10 rounded-3xl flex items-center justify-center mx-auto glow-accent">
                <Download className="w-10 h-10 text-hw-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Unlock All Features</h3>
                <p className="text-xs text-hw-secondary leading-relaxed">
                  QR code generation is exclusive to our Pro Android app. Download for the full experience.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <a 
                  href="https://abdullach56.github.io/ScanGen-PRO/scangen-pro.apk" 
                  download="scangen-pro.apk"
                  className="block w-full bg-hw-accent hover:bg-hw-accent/80 text-white font-bold py-4 rounded-2xl text-[11px] uppercase tracking-widest transition-all glow-accent active:scale-95"
                >
                  Download APK
                </a>
                <button 
                  onClick={() => setShowPrompt(false)}
                  className="w-full text-[10px] font-mono text-hw-secondary uppercase tracking-widest hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-8 rounded-[2.5rem] max-w-md w-full space-y-6 shadow-2xl relative border border-white/10"
            >
              <button 
                onClick={() => setShowFeedback(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-hw-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-hw-accent/10 rounded-2xl flex items-center justify-center glow-accent">
                <MessageSquare className="w-8 h-8 text-hw-accent" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-white">Share Your Feedback</h3>
                <p className="text-xs text-hw-secondary leading-relaxed">
                  Notice a bug or want a new feature? Tell us how we can improve ScanGen-PRO.
                </p>
              </div>

              <div className="space-y-4">
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono text-white outline-none focus:border-hw-accent/50 transition-all placeholder:text-hw-secondary/30 resize-none"
                />
                
                <button 
                  onClick={sendFeedback}
                  disabled={!feedbackText.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-hw-accent disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hw-accent/80 text-white font-bold py-4 rounded-2xl text-[11px] uppercase tracking-widest transition-all glow-accent active:scale-95 shadow-xl"
                >
                  <Send className="w-4 h-4" /> Send Feedback
                </button>
              </div>

              <p className="text-[9px] font-mono text-hw-secondary/40 text-center uppercase tracking-widest">
                This will open your email client
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation — 3 tabs only: Scan, Create, Logs (no barcode) */}
      <nav className="p-6 pt-2">
        <div className="bg-hw-card p-2 rounded-2xl flex items-center justify-between shadow-2xl border border-white/5">
          <NavButton 
            active={activeTab === 'scan'} 
            onClick={() => handleTabChange('scan')} 
            icon={<Scan className="w-4 h-4" />} 
            label="QR Scan" 
          />
          <NavButton 
            active={activeTab === 'generate'} 
            onClick={() => handleTabChange('generate')} 
            icon={<PlusCircle className="w-4 h-4" />} 
            label="Create" 
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => handleTabChange('history')} 
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
  const isWebLink = data.startsWith('http');
  const isDeepLink = isLink(data) && !isWebLink;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="glass-card p-6 rounded-[2rem] space-y-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-hw-accent/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] font-mono text-hw-secondary uppercase tracking-[0.2em] font-bold">Decoded Protocol</p>
          </div>
          <p className="text-sm font-mono break-all leading-relaxed text-white bg-white/5 p-3 rounded-xl border border-white/5">{data}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isLink(data) && (
          <a
            href={data}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex items-center justify-center gap-2 bg-hw-accent hover:bg-hw-accent/80 text-white py-4 rounded-2xl text-[11px] font-mono uppercase tracking-[0.2em] font-bold transition-all glow-accent active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" /> 
            {isDeepLink ? 'Open Secure App' : 'Open Link'}
          </a>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(data)}
          className="flex items-center justify-center gap-2 glass-button text-white py-4 rounded-2xl text-[10px] font-mono uppercase tracking-widest font-bold"
        >
          <Copy className="w-4 h-4 text-hw-secondary" /> Copy
        </button>
        <button
          onClick={onClear}
          className="flex items-center justify-center gap-2 glass-button text-white py-4 rounded-2xl text-[10px] font-mono uppercase tracking-widest font-bold"
        >
          <Scan className="w-4 h-4 text-hw-secondary" /> Dismiss
        </button>
      </div>
    </motion.div>
  );
}
