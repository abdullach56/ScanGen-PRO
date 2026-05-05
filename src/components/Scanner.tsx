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
  fps: 30, // Maximum speed
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
  useBarCodeDetectorIfSupported: true, 
};

export default function Scanner({ onScan }: ScannerProps) {
  const [status, setStatus] = useState<CameraStatus>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
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
    
    // Stop camera if it's running to avoid resource conflicts during file scan
    const wasScanning = scannerRef.current.isScanning;
    if (wasScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
    }

    try {
      // Re-initialize for file scan with all formats just in case
      const fileScanner = new Html5Qrcode("reader", { verbose: false });
      const result = await fileScanner.scanFile(file, true);
      onScan(result, { decodedText: result });
      setStatus('ready');
      
      // Cleanup file scanner
      fileScanner.clear();
      
      // Restart camera if it was running
      if (wasScanning) {
        startScanner();
      }
    } catch (err) {
      setToastMsg("Invalid or no readable QR code detected.");
      setStatus('ready');
      setTimeout(() => setToastMsg(null), 3000);
      
      // Restart camera if it was running
      if (wasScanning) {
        startScanner();
      }
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
        "relative w-full rounded-3xl overflow-hidden border border-hw-border shadow-sm transition-all duration-700 bg-black",
        "aspect-square"
      )}>
        <div id="reader" className="w-full h-full object-cover" />
        
        {/* Overlay Frame */}
        {status === 'ready' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-hw-accent/50 rounded-3xl relative transition-all duration-500 w-3/4 aspect-square shadow-sm">
                {/* Frame Corners */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-hw-accent rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-hw-accent rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-hw-accent rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-hw-accent rounded-br-2xl" />

                {/* Scanning Line */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/2 -translate-x-1/2 w-[90%] h-[2px] bg-hw-accent opacity-80"
                />
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {(status === 'checking' || status === 'scanning_file') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-hw-accent/20 border-t-hw-accent animate-spin" />
              </div>
              <p className="mt-6 text-sm font-sans font-bold text-slate-700 animate-pulse">
                {status === 'checking' ? 'Starting Camera...' : 'Scanning Image...'}
              </p>
              
              {status === 'checking' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3 }}
                  onClick={() => window.location.reload()}
                  className="mt-6 text-xs font-sans text-hw-accent underline hover:text-blue-700 transition-colors"
                >
                  Taking too long? Tap to reload
                </motion.button>
              )}
            </motion.div>
          )}

          {(status === 'denied' || status === 'unavailable' || status === 'error') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 p-8 text-center backdrop-blur-sm"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-50 text-red-500">
                {status === 'denied' ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-slate-900 font-sans text-lg font-bold mb-2">{status === 'denied' ? 'Access Denied' : 'Camera Error'}</h3>
              <p className="text-hw-secondary text-sm mb-6 max-w-[240px]">
                {errorMsg}
              </p>
              <button
                onClick={startScanner}
                className="bg-hw-accent text-white px-6 py-2.5 rounded-xl text-sm font-sans font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-red-500/90 text-white px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold shadow-lg flex items-center gap-2 whitespace-nowrap backdrop-blur-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>


      </div>

      <div className="w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 glass-button py-3.5 rounded-xl text-sm font-sans font-bold"
        >
          <ImageIcon className="w-5 h-5 text-hw-accent" /> 
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
    </div>
  );
}
