import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle, ShieldAlert, Image as ImageIcon, Smartphone, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ScannerProps {
  onScan: (decodedText: string, decodedResult: any) => void;
}

type CameraStatus = 'checking' | 'ready' | 'denied' | 'unavailable' | 'error' | 'scanning_file';

const SCAN_CONFIG = {
  fps: 20, // Increased for smoother detection
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdgeSize * 0.75);
    return {
      width: qrboxSize,
      height: qrboxSize
    };
  },
  aspectRatio: 1.0,
  disableFlip: false,
};

export default function Scanner({ onScan }: ScannerProps) {
  const [status, setStatus] = useState<CameraStatus>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Failed to stop scanner", err);
        }
      }
      // Releasing internal references for GC
      try {
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
      setIsCameraActive(false);
    }
  }, []);

  const isInitializing = useRef(false);

  const startScanner = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      
      setStatus('checking');
      setErrorMsg(null);

      const formats = [Html5QrcodeSupportedFormats.QR_CODE];

      // Ensure clean state and existence
      const element = document.getElementById("reader");
      if (!element) {
        console.error("Scanner element not found in DOM");
        isInitializing.current = false;
        return;
      }
      element.innerHTML = "";

      scannerRef.current = new Html5Qrcode("reader", { 
        formatsToSupport: formats,
        verbose: false 
      });

      // Primary attempt: Environment camera
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          SCAN_CONFIG,
          (decodedText, decodedResult) => {
            onScan(decodedText, decodedResult);
          },
          () => {}
        );
      } catch (e) {
        console.warn("Back camera failed, trying fallback...", e);
        await scannerRef.current.start(
          { facingMode: "user" },
          SCAN_CONFIG,
          (decodedText, decodedResult) => {
            onScan(decodedText, decodedResult);
          },
          () => {}
        );
      }

      setStatus('ready');
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Scanner startup error:", err);
      const errorStr = String(err).toLowerCase();
      
      if (errorStr.includes("permission") || errorStr.includes("notallowed")) {
        setStatus('denied');
        setErrorMsg("Camera access denied. Please enable permission in settings.");
      } else {
        setStatus('error');
        setErrorMsg("Failed to connect to hardware sensor.");
      }
    } finally {
      isInitializing.current = false;
    }
  }, [onScan]);

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setStatus('scanning_file');
    try {
      const result = await scannerRef.current.scanFile(file, true);
      onScan(result, { decodedText: result });
      setStatus('ready');
    } catch (err) {
      setErrorMsg("No readable QR code detected in image.");
      setStatus('error');
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <div className={cn(
        "relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700",
        "aspect-square"
      )}>
        <div id="reader" className="w-full h-full object-cover" />
        
        {/* HUD Overlay */}
        {status === 'ready' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-hw-accent/30 rounded-3xl relative transition-all duration-500 w-3/4 aspect-square">
                {/* HUD Corners */}
                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-hw-accent glow-accent rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-hw-accent glow-accent rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-hw-accent glow-accent rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-hw-accent glow-accent rounded-br-2xl" />

                {/* Scanning Line */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/2 -translate-x-1/2 w-[90%] h-[2px] bg-hw-accent glow-accent opacity-60"
                />

                {/* HUD Data Text */}
                <div className="absolute -bottom-12 left-0 right-0 flex justify-between px-2 text-[8px] font-mono text-hw-accent/60 uppercase tracking-widest">
                  <span>X_{Math.random().toString(16).slice(2, 6)}</span>
                  <span>PROC_EN_AUTO</span>
                  <span>Y_{Math.random().toString(16).slice(2, 6)}</span>
                </div>
              </div>
            </div>
            
            {/* Ambient vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {(status === 'checking' || status === 'scanning_file') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-hw-bg/90 backdrop-blur-md"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-hw-accent/10 border-t-hw-accent animate-spin" />
                <Cpu className="absolute inset-0 m-auto w-8 h-8 text-hw-accent animate-pulse" />
              </div>
              <p className="mt-6 text-[10px] font-mono text-white uppercase tracking-[0.4em] animate-pulse pl-1">
                {status === 'checking' ? 'Initializing Core' : 'Parsing QR Matrix'}
              </p>
              
              {status === 'checking' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 5 }}
                  onClick={() => window.location.reload()}
                  className="mt-8 text-[9px] font-mono text-hw-accent uppercase tracking-widest border border-hw-accent/20 px-4 py-2 rounded-full hover:bg-hw-accent/10 transition-colors"
                >
                  Taking too long? Tap to Rescue
                </motion.button>
              )}
            </motion.div>
          )}

          {(status === 'denied' || status === 'unavailable' || status === 'error') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-hw-card/95 p-10 text-center backdrop-blur-lg"
            >
              <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mb-6 glow-accent border-hw-accent/20">
                {status === 'denied' ? (
                  <ShieldAlert className="w-10 h-10 text-hw-accent" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-hw-accent" />
                )}
              </div>
              <h3 className="text-white font-mono text-sm uppercase font-bold mb-3 tracking-widest">{status === 'denied' ? 'Access Denied' : 'System Error'}</h3>
              <p className="text-hw-secondary text-[10px] font-mono mb-8 uppercase leading-relaxed max-w-[240px] tracking-tight">
                {errorMsg}
              </p>
              <button
                onClick={startScanner}
                className="bg-hw-accent text-white px-8 py-3 rounded-2xl text-[10px] font-mono uppercase tracking-[0.3em] font-bold glow-accent hover:scale-105 active:scale-95 transition-all"
              >
                Re-Initialize
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Indicators */}
        {status === 'ready' && (
          <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
            <div className="w-2 h-2 rounded-full bg-hw-accent animate-ping glow-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-black leading-none mb-1">Live_Feed_ON</span>
               <span className="text-[8px] font-mono text-hw-accent uppercase opacity-60">Mode: QR</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 glass-button text-white py-5 rounded-[2rem] text-[11px] font-mono uppercase tracking-[0.2em] font-bold group"
        >
          <ImageIcon className="w-5 h-5 text-hw-accent group-hover:scale-110 transition-transform glow-accent" /> 
          Upload QR Image
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileScan} 
        />
      </div>

      <div className="text-center space-y-1.5 pt-2">
        <p className="text-[9px] font-mono text-hw-secondary uppercase tracking-[0.3em] font-bold opacity-40">
          Hardware Interface active :: Back_Cam
        </p>
        <p className="text-[8px] font-mono text-hw-accent/40 uppercase tracking-[0.1em]">
          Standard: ISO/IEC 18004 QR Matrix
        </p>
      </div>
    </div>
  );
}
