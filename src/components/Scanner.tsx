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

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      <div className="relative w-full aspect-square bg-hw-card rounded-2xl overflow-hidden border-4 border-hw-card shadow-2xl flex items-center justify-center">
        <div id="reader" className={cn("w-full h-full", status !== 'ready' && "hidden")} />
        
        <AnimatePresence mode="wait">
          {status === 'checking' && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-3"
            >
              <RefreshCw className="w-8 h-8 text-hw-secondary animate-spin" />
              <span className="text-[10px] font-mono text-hw-secondary uppercase tracking-widest">Initializing...</span>
            </motion.div>
          )}

          {(status === 'denied' || status === 'unavailable' || status === 'error') && (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-4"
            >
              {status === 'denied' ? (
                <ShieldAlert className="w-12 h-12 text-hw-accent mx-auto" />
              ) : (
                <AlertCircle className="w-12 h-12 text-hw-accent mx-auto" />
              )}
              <div className="space-y-2">
                <h3 className="text-white font-mono text-sm uppercase tracking-wider">
                  {status === 'denied' ? 'Access Denied' : 'Camera Error'}
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
