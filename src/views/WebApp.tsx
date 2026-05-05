import { useState, useEffect, useCallback, useRef } from 'react';
import { Scan, PlusCircle, History, Trash2, Copy, ExternalLink, CheckCircle2, Download, ChevronLeft, MessageSquare, Send, X, Wifi, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Scanner from '../components/Scanner';
import Generator from '../components/Generator';
import WifiQrGenerator from '../components/WifiQrGenerator';
import Stats from '../components/Stats';
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
  const [activeTab, setActiveTab] = useState<'scan' | 'generate' | 'history' | 'stats'>('scan');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [lastScanned, setLastScanned] = useState<{ text: string; type: 'QR' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [generateMode, setGenerateMode] = useState<'standard' | 'wifi'>('standard');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScanHistoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
      const filtered = prev.filter(item => item.text !== sanitized);
      const updated = [newItem, ...filtered].slice(0, 50);
      localStorage.setItem('scan-history-v2', JSON.stringify(updated));
      return updated;
    });
    
    setLastScanned({ text: sanitized, type: 'QR' });
  }, []);

  const handleScanQR = useCallback((text: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Beep failed", e);
    }
    saveToHistory(text);
    
    const lowerText = text.toLowerCase().trim();
    
    // Auto-open logic for specific protocols
    if (
      lowerText.startsWith('tel:') || 
      lowerText.startsWith('sms:') || 
      lowerText.startsWith('mailto:') || 
      lowerText.startsWith('whatsapp:') || 
      lowerText.startsWith('upi:') ||
      lowerText.startsWith('geo:') ||
      lowerText.startsWith('vcard:')
    ) {
      window.location.href = text;
    } else if (lowerText.startsWith('wifi:')) {
      // WiFi protocol doesn't have a native browser handler, but we can show it
      console.log("WiFi QR Detected", text);
    } else if (/^\+?[\d\s-]{7,15}$/.test(text.trim())) {
      window.location.href = `tel:${text.replace(/[\s-]/g, '')}`;
    } else if (lowerText.startsWith('http://') || lowerText.startsWith('https://')) {
      window.open(text, '_blank', 'noopener,noreferrer');
    } else if (isLink(text)) {
      window.location.href = text;
    }
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

  const handleTabChange = (tab: 'scan' | 'generate' | 'history' | 'stats') => {
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 200) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredHistory = history.filter(item => 
    item.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-hw-bg mesh-bg shadow-2xl border-x border-hw-border relative overflow-hidden">
      <header className="p-8 pb-4 space-y-1 relative z-10">
        <div className="flex items-center justify-between">
          {!isNative && onBack ? (
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl hover:bg-white/5 transition-all text-hw-secondary hover:text-white group"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Exit Demo</span>
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFeedback(true)}
              className="p-2 bg-white rounded-xl border border-hw-border hover:bg-slate-50 transition-all text-hw-secondary shadow-sm"
              title="Give Feedback"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 bg-hw-accent/10 rounded-full border border-hw-accent/20 shadow-sm flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-hw-accent animate-ping" />
              <span className="text-[9px] font-sans text-hw-accent uppercase font-black tracking-wider">V1.3.2</span>
            </div>
          </div>
        </div>
        <div className="pt-4 flex items-center gap-3">
          <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center overflow-hidden">
            <img src="./logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
          </div>
          <h1 className="text-2xl font-sans font-bold tracking-tight text-slate-900">
            ScanGen<span className="text-hw-accent">PRO</span>
          </h1>
        </div>
        {!isNative && (
          <p className="text-[10px] font-mono text-hw-secondary/60 uppercase tracking-[0.3em] pl-1">Live Web Preview (Limited)</p>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-6 relative" onScroll={activeTab === 'history' ? handleScroll : undefined} ref={activeTab === 'history' ? historyContainerRef : undefined}>
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
              className="space-y-6"
            >
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4 border border-hw-border">
                <button
                  onClick={() => setGenerateMode('standard')}
                  className={cn(
                    "flex-1 py-2 text-[11px] font-sans font-bold rounded-xl transition-all",
                    generateMode === 'standard' ? "bg-white text-slate-900 shadow-sm" : "text-hw-secondary hover:text-slate-900"
                  )}
                >
                  Standard
                </button>
                <button
                  onClick={() => setGenerateMode('wifi')}
                  className={cn(
                    "flex-1 py-2 text-[11px] font-sans font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                    generateMode === 'wifi' ? "bg-white text-slate-900 shadow-sm" : "text-hw-secondary hover:text-slate-900"
                  )}
                >
                  <Wifi className="w-3 h-3" /> WiFi
                </button>
              </div>
              
              {generateMode === 'standard' ? <Generator /> : <WifiQrGenerator />}
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
                <h2 className="text-lg font-sans font-bold text-slate-900">Recent Activity</h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-[11px] font-sans font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>

              {history.length > 0 && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by text, wifi, payment..."
                    className="w-full bg-white border border-hw-border rounded-xl py-3 px-4 text-sm font-sans text-slate-900 outline-none focus:border-hw-accent focus:ring-4 focus:ring-hw-accent/10 transition-all placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              )}

              {filteredHistory.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-40">
                  <History className="w-12 h-12 mx-auto text-hw-secondary" />
                  <p className="text-xs font-mono uppercase tracking-widest">No history found</p>
                </div>
              ) : (
                <div className="space-y-3 pb-10">
                  {filteredHistory.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      onClick={() => setSelectedHistoryItem(item)}
                      className="bg-white p-4 rounded-2xl border border-hw-border shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-sans bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-[10px] font-sans text-slate-400 font-bold uppercase">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-sm font-sans break-all line-clamp-2 text-slate-900 mt-1">{item.text}</p>
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

              <AnimatePresence>
                {showScrollTop && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-6 p-3 bg-hw-accent text-white rounded-full shadow-lg glow-accent z-40 hover:scale-110 transition-transform"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-90" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Stats history={history} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
              className="bg-white p-8 rounded-3xl max-w-xs w-full space-y-6 text-center shadow-xl border border-hw-border"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto">
                <Download className="w-10 h-10 text-hw-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Unlock All Features</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
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
                  className="w-full text-[10px] font-sans text-slate-400 uppercase tracking-widest hover:text-hw-accent transition-colors mt-2"
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
              className="bg-white p-8 rounded-3xl max-w-md w-full space-y-6 shadow-xl relative border border-hw-border"
            >
              <button 
                onClick={() => setShowFeedback(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-hw-accent" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Share Your Feedback</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Notice a bug or want a new feature? Tell us how we can improve ScanGen-PRO.
                </p>
              </div>

              <div className="space-y-4">
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-32 bg-white border border-hw-border rounded-2xl p-4 text-sm font-sans text-slate-900 outline-none focus:border-hw-accent focus:ring-4 focus:ring-hw-accent/10 transition-all placeholder:text-slate-400 resize-none shadow-sm"
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

      {/* History Item Modal */}
      <AnimatePresence>
        {selectedHistoryItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 rounded-3xl max-w-sm w-full space-y-5 relative border border-hw-border shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedHistoryItem(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-hw-accent" />
                <h3 className="text-sm font-bold tracking-tight text-slate-900 font-sans">Full Details</h3>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-hw-border">
                <p className="text-sm font-sans break-all whitespace-pre-wrap text-slate-900 leading-relaxed">
                  {selectedHistoryItem.text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {isLink(selectedHistoryItem.text) && (
                  <button
                    onClick={() => {
                      if (selectedHistoryItem.text.startsWith('http')) {
                        window.open(selectedHistoryItem.text, '_blank', 'noopener,noreferrer');
                      } else {
                        window.location.href = selectedHistoryItem.text;
                      }
                    }}
                    className="col-span-2 flex items-center justify-center gap-2 bg-hw-accent hover:bg-hw-accent/80 text-white py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold transition-all glow-accent"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Link
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(selectedHistoryItem.text, selectedHistoryItem.id)}
                  className="flex items-center justify-center gap-2 glass-button text-white py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold"
                >
                  {copiedId === selectedHistoryItem.id ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-hw-secondary" />
                  )}
                  Copy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation — 4 tabs: Scan, Create, Logs, Stats */}
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
          <NavButton 
            active={activeTab === 'stats'} 
            onClick={() => handleTabChange('stats')} 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Stats" 
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
        active ? "bg-slate-100 text-hw-accent shadow-sm" : "text-hw-secondary hover:text-slate-700"
      )}
    >
      <div className={cn("mb-1 transition-transform duration-300 relative", active && "scale-110")}>
        {icon}
        {label === "Create" && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
        )}
      </div>
      <span className="text-[10px] font-sans font-bold">{label}</span>
    </button>
  );
}

function ResultCard({ data, onClear }: { data: string; onClear: () => void }) {
  const isWebLink = data.startsWith('http');
  const isDeepLink = isLink(data) && !isWebLink;
  const isWifi = data.toUpperCase().startsWith('WIFI:');

  const parseWifi = (wifiData: string) => {
    const ssid = wifiData.match(/S:([^;]+);/)?.[1] || 'Unknown';
    const pass = wifiData.match(/P:([^;]+);/)?.[1] || 'None';
    const type = wifiData.match(/T:([^;]+);/)?.[1] || 'Open';
    return { ssid, pass, type };
  };

  const wifi = isWifi ? parseWifi(data) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="glass-card p-6 rounded-[2rem] space-y-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("w-2 h-2 rounded-full", isWifi ? "bg-hw-accent animate-pulse" : "bg-green-500")} />
            <p className="text-[11px] font-sans text-hw-secondary font-bold">
              {isWifi ? 'WiFi Configuration Detected' : 'Decoded Protocol'}
            </p>
          </div>
          
          {isWifi && wifi ? (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Network (SSID)</span>
                <span className="text-sm font-bold text-slate-900">{wifi.ssid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Security</span>
                <span className="text-xs font-mono font-bold text-slate-600">{wifi.type}</span>
              </div>
              {wifi.pass !== 'None' && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Password</span>
                  <span className="text-xs font-mono font-bold text-slate-600">••••••••</span>
                </div>
              )}
              <p className="text-[9px] text-hw-accent font-bold pt-1">Connect via system WiFi settings</p>
            </div>
          ) : (
            <p className="text-sm font-sans break-all leading-relaxed text-slate-900 bg-slate-50 p-4 rounded-xl border border-hw-border shadow-sm">{data}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigator.clipboard.writeText(isWifi && wifi ? wifi.pass : data)}
          className="flex items-center justify-center gap-2 glass-button text-slate-700 py-4 rounded-2xl text-[11px] font-sans font-bold"
        >
          <Copy className="w-4 h-4 text-hw-secondary" /> {isWifi ? 'Copy Pass' : 'Copy'}
        </button>
        <button
          onClick={onClear}
          className="flex items-center justify-center gap-2 glass-button text-slate-700 py-4 rounded-2xl text-[11px] font-sans font-bold"
        >
          <Scan className="w-4 h-4 text-hw-secondary" /> Dismiss
        </button>
      </div>
    </motion.div>
  );
}
