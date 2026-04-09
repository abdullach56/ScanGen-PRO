import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface ScannerProps {
  onScan: (decodedText: string, decodedResult: any) => void;
}

type CameraStatus = 'checking' | 'ready' | 'denied' | 'unavailable' | 'error';

export default function Scanner({ onScan }: ScannerProps) {
  const [status, setStatus] = useState<CameraStatus>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const startScanner = async () => {
    setStatus('checking');
    setErrorMsg(null);

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setStatus('unavailable');
        setErrorMsg("No camera hardware detected.");
        return;
      }

      const scanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 20, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * 0.75);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          supportedScanTypes: [0], 
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          onScan(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Frame scan failures are normal
        }
      );

      scannerRef.current = scanner;
      setStatus('ready');
    } catch (err: any) {
      console.error("Scanner init error:", err);
      if (err?.toString().toLowerCase().includes("permission")) {
        setStatus('denied');
        setErrorMsg("Camera access was denied. Please enable it in your browser settings.");
      } else {
        setStatus('error');
        setErrorMsg("An unexpected error occurred while starting the camera.");
      }
    }
  };

  useEffect(() => {
    startScanner();

    // Inject styles for the library UI
    const style = document.createElement('style');
    style.innerHTML = `
      #reader button {
        background-color: #FF4444 !important;
        color: white !important;
        border: none !important;
        padding: 10px 20px !important;
        border-radius: 8px !important;
        font-family: 'JetBrains Mono', monospace !important;
        text-transform: uppercase !important;
        font-size: 12px !important;
        letter-spacing: 1px !important;
        cursor: pointer !important;
        margin-top: 10px !important;
        transition: all 0.2s !important;
      }
      #reader button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 0 20px rgba(255, 68, 68, 0.4) !important;
      }
      #reader img {
        display: none !important;
      }
      #reader {
        border: none !important;
      }
      #reader__scan_region {
        background: transparent !important;
      }
      #reader__dashboard_section_csr button {
        margin: 5px !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      <div className="relative w-full aspect-square bg-[#1a1c20] rounded-2xl overflow-hidden border-4 border-hw-card/40 shadow-2xl flex items-center justify-center">
        {/* The reader div is always present but we control its visibility of the library UI vs our overlay */}
        <div id="reader" className={cn("w-full h-full z-0", status !== 'ready' && "opacity-20")} />
        
        {/* Scanning Animation Overlay (Always visible or based on status) */}
        {status === 'ready' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-0 left-0 w-full h-full border-[40px] border-hw-card/60" />
            <motion.div 
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-hw-accent shadow-[0_0_15px_rgba(255,68,68,0.8)] z-20"
            />
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {status === 'checking' && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full border-4 border-hw-accent/20 border-t-hw-accent animate-spin flex items-center justify-center">
                <Camera className="w-6 h-6 text-hw-accent" />
              </div>
              <div className="text-center space-y-2">
                <span className="text-sm font-mono text-white uppercase tracking-[0.2em] font-bold block">Initializing Camera</span>
                <p className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest max-w-[200px] leading-relaxed">
                  Please click "Allow" when the browser asks for camera access.
                </p>
              </div>
            </motion.div>
          )}

          {(status === 'denied' || status === 'unavailable' || status === 'error') && (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-6 z-30 bg-hw-card/90 backdrop-blur-md rounded-2xl border border-white/10"
            >
              {status === 'denied' ? (
                <ShieldAlert className="w-16 h-16 text-hw-accent mx-auto" />
              ) : (
                <AlertCircle className="w-16 h-16 text-hw-accent mx-auto" />
              )}
              <div className="space-y-3">
                <h3 className="text-white font-mono text-lg uppercase tracking-tighter font-bold">
                  {status === 'denied' ? 'Access Blocked' : 'hardware Error'}
                </h3>
                <p className="text-hw-secondary text-[10px] font-mono leading-relaxed max-w-[200px] mx-auto">
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={startScanner}
                className="bg-hw-accent text-white px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Retry Connection
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hardware overlays */}
        {status === 'ready' && (
          <>
            <div className="absolute inset-0 pointer-events-none border border-hw-secondary/20 rounded-xl" />
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-hw-accent animate-pulse" />
              <span className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest">Live Feed</span>
            </div>
            <div className="absolute bottom-4 right-4">
              <Camera className="w-4 h-4 text-hw-secondary opacity-50" />
            </div>
          </>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-mono text-hw-secondary uppercase tracking-tighter">
          {status === 'ready' ? 'Position code within the frame' : 'Hardware Status Check'}
        </p>
        <p className="text-[10px] font-mono text-hw-secondary/60 uppercase">
          {status === 'ready' ? 'Supports QR, Barcode, DataMatrix' : 'Awaiting camera initialization'}
        </p>
      </div>
    </div>
  );
}
